interface ChatOptions {
  apiKey: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

export async function openRouterChat(options: ChatOptions): Promise<string> {
  const { apiKey, model, messages, maxTokens = 2000 } = options;

  if (!apiKey) throw new Error('OpenRouter API key not set. Go to VS Code Settings → VibeFlow → OpenRouter Key.');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vibeflow-cloud.vercel.app',
      'X-Title': 'VibeFlow'
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${err}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}
