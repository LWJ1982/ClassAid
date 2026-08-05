/**
 * POST /api/generate - Cloudflare Pages Function
 * AI question generation from module content using Groq
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { callGroq, GroqError } from '../lib/groq';
import { generateRequestSchema } from '../lib/validation';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();

    const parsed = generateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { moduleId, requestedBy, questionKind } = parsed.data;
    const supabase = createSupabaseClient(env);

    // Load activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('module_id', moduleId)
      .order('sequence', { ascending: true });

    if (activitiesError) {
      console.error('Activities query error:', activitiesError.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Load source chunks for context
    const { data: chunks, error: chunksError } = await supabase
      .from('source_chunks')
      .select('content, section')
      .eq('module_id', moduleId)
      .order('chunk_index', { ascending: true });

    if (chunksError) {
      console.error('Chunks query error:', chunksError.message);
    }

    const sourceContext = (chunks || [])
      .map((c) => `[${c.section || 'Section'}]\n${c.content}`)
      .join('\n\n')
      .substring(0, 4000);

    const generatedQuestions: { id: string; questionText: string; status: string }[] = [];

    for (const activity of activities || []) {
      const prompt = `Generate ONE multiple-choice comprehension question for this activity.

Activity: "${activity.title}"
Content: "${activity.content.substring(0, 500)}"

Source material: ${sourceContext.substring(0, 1500)}

Respond ONLY with JSON: {"questionText":"...","options":["A","B","C","D"],"correctAnswer":"exact option text","explanation":"...","failureHint":"..."}`;

      try {
        const result = await callGroq(env.GROQ_API_KEY, {
          messages: [
            {
              role: 'system',
              content: 'Generate educational questions. Respond with valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          maxTokens: 600,
        });

        // Parse JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const questionData = JSON.parse(jsonMatch[0]) as {
            questionText?: string;
            options?: string[];
            correctAnswer?: string;
            explanation?: string;
            failureHint?: string;
          };

          // Validate required fields
          if (
            questionData.questionText &&
            questionData.options &&
            Array.isArray(questionData.options) &&
            questionData.options.length === 4 &&
            questionData.correctAnswer &&
            questionData.options.includes(questionData.correctAnswer)
          ) {
            const qId = crypto.randomUUID();

            const { error: insertError } = await supabase.from('questions').insert({
              id: qId,
              module_id: moduleId,
              competency_id: activity.competency_id,
              question_text: questionData.questionText,
              question_type: 'multiple-choice',
              options: questionData.options,
              correct_answer: questionData.correctAnswer,
              explanation: questionData.explanation || '',
              critical: false,
              question_kind: questionKind,
              activity_id: activity.id,
              approval_status: 'auto_generated',
              failure_hint: questionData.failureHint || '',
              min_read_seconds: 25,
              generated_at: new Date().toISOString(),
            });

            if (!insertError) {
              generatedQuestions.push({
                id: qId,
                questionText: questionData.questionText,
                status: 'auto_generated',
              });
            } else {
              console.error('Question insert error:', insertError.message);
            }
          }
          // Discard malformed output silently (per AI boundaries)
        }
      } catch (error) {
        if (error instanceof GroqError) {
          console.error(`Groq error for activity ${activity.id}:`, error.message);
        }
        // Continue generating for other activities
      }
    }

    return Response.json({
      generated: generatedQuestions.length,
      questions: generatedQuestions,
      message: `${generatedQuestions.length} questions generated and pending instructor approval.`,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
