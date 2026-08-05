import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callGroq, GroqError } from '../../functions/lib/groq';

describe('Groq Client - callGroq', () => {
  const mockApiKey = 'test-api-key-12345';
  const defaultOptions = {
    messages: [{ role: 'user', content: 'Hello' }],
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns response content on successful API call', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Hello! How can I help?' } }],
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await callGroq(mockApiKey, defaultOptions);

    expect(result).toBe('Hello! How can I help?');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`,
        },
      })
    );
  });

  it('sends correct model and parameters in request body', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'response' } }],
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await callGroq(mockApiKey, {
      messages: [{ role: 'system', content: 'You are helpful' }],
      temperature: 0.7,
      maxTokens: 500,
    });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);

    expect(body.model).toBe('llama-3.1-70b-versatile');
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(500);
    expect(body.messages).toEqual([{ role: 'system', content: 'You are helpful' }]);
  });

  it('throws GroqError with status 429 on rate limit', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: vi.fn(),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toThrow(GroqError);
    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringContaining('Rate limit'),
    });
  });

  it('throws GroqError on non-200 response', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn(),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toThrow(GroqError);
    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('throws GroqError on timeout (AbortError)', async () => {
    // Simulate fetch that immediately rejects with an AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.mocked(fetch).mockRejectedValue(abortError);

    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toThrow(GroqError);
    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toMatchObject({
      statusCode: 408,
      message: expect.stringContaining('timed out'),
    });
  });

  it('throws GroqError on malformed response (empty choices)', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toThrow(GroqError);
    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toMatchObject({
      statusCode: 500,
      message: expect.stringContaining('Malformed'),
    });
  });

  it('throws GroqError on malformed response (missing content)', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: {} }],
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toThrow(GroqError);
    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('throws GroqError on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toThrow(GroqError);
    await expect(callGroq(mockApiKey, defaultOptions)).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('uses default temperature and maxTokens when not specified', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'response' } }],
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await callGroq(mockApiKey, { messages: [{ role: 'user', content: 'hi' }] });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);

    expect(body.temperature).toBe(0.3);
    expect(body.max_tokens).toBe(1000);
  });
});
