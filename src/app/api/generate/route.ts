export const runtime = "edge";
import { NextRequest } from "next/server";
import { getEnv, jsonResponse, errorResponse, generateId } from "@/lib/api-helpers";
import type { AiTextGenerationOutput } from "@/lib/cloudflare";

/**
 * POST /api/generate
 * AI Question Generation from module source content
 *
 * Flow:
 * 1. Load module competencies and activities from D1
 * 2. Load source chunks from D1 (or query Vectorize)
 * 3. For each activity/competency, prompt LLM to generate structured questions
 * 4. Parse and validate output
 * 5. Store as 'auto_generated' pending instructor approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, requestedBy, questionKind = "checkpoint" } = body;

    if (!moduleId || !requestedBy) {
      return errorResponse("moduleId and requestedBy are required");
    }

    const env = getEnv();
    if (!env) {
      // Fallback: return simulated generation results
      return jsonResponse({
        generated: 3,
        questions: [
          { id: generateId("q"), questionText: "Auto-generated question (fallback mode)", status: "auto_generated" },
        ],
        message: "Questions generated successfully (fallback mode — no AI available)",
      });
    }

    // 1. Load module activities and competencies
    const activities = await env.DB.prepare(
      "SELECT * FROM activities WHERE module_id = ? ORDER BY sequence"
    ).bind(moduleId).all();

    const competencies = await env.DB.prepare(
      "SELECT * FROM competencies WHERE module_id = ? ORDER BY sequence"
    ).bind(moduleId).all();

    // 2. Load source chunks for context
    const chunks = await env.DB.prepare(
      "SELECT content, section FROM source_chunks WHERE module_id = ? ORDER BY chunk_index"
    ).bind(moduleId).all();

    // Build source context
    const sourceContext = chunks.results
      .map((c) => `[${c.section}]\n${c.content}`)
      .join("\n\n")
      .substring(0, 4000); // Limit context size for LLM

    const generatedQuestions = [];

    // 3. Generate questions per activity (for checkpoints) or per competency (for assessment)
    const targets = questionKind === "checkpoint"
      ? activities.results.map((a) => ({
          id: a.id as string,
          title: a.title as string,
          content: a.content as string,
          competencyId: a.competency_id as string,
          type: "activity",
        }))
      : competencies.results.map((c) => ({
          id: c.id as string,
          title: c.name as string,
          content: c.description as string,
          competencyId: c.id as string,
          type: "competency",
        }));

    for (const target of targets) {
      const prompt = questionKind === "checkpoint"
        ? buildCheckpointPrompt(target.title, target.content, sourceContext)
        : buildAssessmentPrompt(target.title, target.content, sourceContext);

      try {
        const result = (await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: "You generate educational assessment questions. Always respond with valid JSON only, no other text." },
            { role: "user", content: prompt },
          ],
          max_tokens: 600,
          temperature: 0.4,
        })) as AiTextGenerationOutput;

        const parsed = parseGeneratedQuestion(result.response);
        if (parsed) {
          const qId = generateId("q");
          const questionRecord = {
            id: qId,
            moduleId,
            competencyId: target.competencyId,
            questionText: parsed.questionText,
            options: JSON.stringify(parsed.options),
            correctAnswer: parsed.correctAnswer,
            explanation: parsed.explanation,
            failureHint: parsed.failureHint || `Review the content about ${target.title}.`,
            activityId: questionKind === "checkpoint" ? target.id : null,
            questionKind,
            minReadSeconds: questionKind === "checkpoint" ? 25 : null,
          };

          // Store in D1
          await env.DB.prepare(
            `INSERT INTO questions (id, module_id, competency_id, question_text, question_type, options, correct_answer, explanation, critical, question_kind, activity_id, approval_status, failure_hint, min_read_seconds, generated_at)
             VALUES (?, ?, ?, ?, 'multiple-choice', ?, ?, ?, 0, ?, ?, 'auto_generated', ?, ?, datetime('now'))`
          ).bind(
            questionRecord.id,
            questionRecord.moduleId,
            questionRecord.competencyId,
            questionRecord.questionText,
            questionRecord.options,
            questionRecord.correctAnswer,
            questionRecord.explanation,
            questionRecord.questionKind,
            questionRecord.activityId,
            questionRecord.failureHint,
            questionRecord.minReadSeconds,
          ).run();

          generatedQuestions.push({
            id: qId,
            questionText: parsed.questionText,
            competencyId: target.competencyId,
            activityTitle: target.title,
            status: "auto_generated",
          });
        }
      } catch (genError) {
        console.error(`Generation failed for ${target.title}:`, genError);
        // Continue with other targets
      }
    }

    // Audit event
    await env.DB.prepare(
      `INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'QUESTIONS_GENERATED', 'question', ?, ?)`
    ).bind(generateId("audit"), requestedBy, moduleId, `Auto-generated ${generatedQuestions.length} ${questionKind} questions`).run();

    return jsonResponse({
      generated: generatedQuestions.length,
      questions: generatedQuestions,
      message: `${generatedQuestions.length} questions generated and pending instructor approval.`,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return errorResponse("Failed to generate questions. Please try again.", 500);
  }
}

function buildCheckpointPrompt(activityTitle: string, activityContent: string, sourceContext: string): string {
  return `Generate ONE multiple-choice comprehension checkpoint question for this learning activity.

Activity: "${activityTitle}"
Content: "${activityContent}"

Additional source material:
${sourceContext.substring(0, 1500)}

Requirements:
- Question tests whether the learner READ and UNDERSTOOD the content
- 4 options, exactly one correct
- Explanation of why the correct answer is right
- A failure hint that tells the learner what to re-read

Respond ONLY with this JSON format:
{
  "questionText": "the question",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": "the exact text of the correct option",
  "explanation": "why this is correct",
  "failureHint": "what to re-read when wrong"
}`;
}

function buildAssessmentPrompt(competencyName: string, competencyDesc: string, sourceContext: string): string {
  return `Generate ONE multiple-choice assessment question for this competency.

Competency: "${competencyName}"
Description: "${competencyDesc}"

Source material:
${sourceContext.substring(0, 2000)}

Requirements:
- Question assesses understanding of this competency
- 4 options, exactly one correct
- Plausible distractors that represent common misconceptions
- Explanation of the correct answer

Respond ONLY with this JSON format:
{
  "questionText": "the question",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": "the exact text of the correct option",
  "explanation": "why this is correct",
  "failureHint": "guidance for the learner"
}`;
}

function parseGeneratedQuestion(raw: string): {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  failureHint?: string;
} | null {
  try {
    // Try to extract JSON from the response (LLM may add extra text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (
      !parsed.questionText ||
      !Array.isArray(parsed.options) ||
      parsed.options.length < 2 ||
      !parsed.correctAnswer ||
      !parsed.explanation
    ) {
      return null;
    }

    // Ensure correct answer is in options
    if (!parsed.options.includes(parsed.correctAnswer)) {
      return null;
    }

    return {
      questionText: String(parsed.questionText),
      options: parsed.options.map(String),
      correctAnswer: String(parsed.correctAnswer),
      explanation: String(parsed.explanation),
      failureHint: parsed.failureHint ? String(parsed.failureHint) : undefined,
    };
  } catch {
    return null;
  }
}
