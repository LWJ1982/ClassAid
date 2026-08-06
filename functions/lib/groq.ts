/**
 * Groq API client wrapper
 * Calls https://api.groq.com/openai/v1/chat/completions
 * Model: llama-3.1-70b-versatile
 */

export interface GroqMessage {
  role: string;
  content: string;
}

export interface GroqOptions {
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface GroqResponse {
  choices: { message: { content: string } }[];
}

/**
 * Calls the Groq API with the given messages and options.
 * Returns the assistant's response content as a string.
 * Handles rate limits (429), timeouts, and malformed responses.
 */
export async function callGroq(apiKey: string, options: GroqOptions): Promise<string> {
  const { messages, temperature = 0.3, maxTokens = 1000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new GroqError('Rate limit exceeded. Please try again later.', 429);
    }

    if (!response.ok) {
      throw new GroqError(
        `Groq API error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json() as GroqResponse;

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new GroqError('Malformed response from Groq API', 500);
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof GroqError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GroqError('Groq API request timed out', 408);
    }
    throw new GroqError(
      `Failed to call Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export class GroqError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'GroqError';
    this.statusCode = statusCode;
  }
}
