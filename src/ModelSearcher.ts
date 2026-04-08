import { openRouterChat } from './openrouter';

export interface ModelResult {
  id: string;
  name: string;
  provider: string;
  strengths: string[];
  recommended: boolean;
  openRouterSlug: string;
}

interface SearchOptions {
  task: string;
  openRouterKey: string;
}

export class ModelSearcher {
  static async search(options: SearchOptions): Promise<ModelResult[]> {
    const { task, openRouterKey } = options;

    try {
      const text = await openRouterChat({
        apiKey: openRouterKey,
        model: 'perplexity/sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Search OpenRouter's model catalog and list the TOP 5 most appropriate AI models for this task: "${task}".

For each model return:
- OpenRouter model ID (exact slug like "anthropic/claude-sonnet-4-5")
- Provider name
- Key strengths for this task
- Whether it's the top recommendation

Return ONLY valid JSON array:
[{"id":"...", "name":"...", "provider":"...", "strengths":["..."], "recommended":true/false, "openRouterSlug":"..."}]`
          }
        ]
      });

      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return this.getDefaults();
    }
  }

  private static getDefaults(): ModelResult[] {
    return [
      { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', strengths: ['Coding', 'Reasoning', 'Tool use'], recommended: true, openRouterSlug: 'anthropic/claude-sonnet-4-5' },
      { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro', provider: 'Google', strengths: ['Vision', 'Long context', 'Speed'], recommended: false, openRouterSlug: 'google/gemini-2.0-pro-exp-02-05:free' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', strengths: ['Complex reasoning', 'Long documents'], recommended: false, openRouterSlug: 'anthropic/claude-3.5-sonnet' }
    ];
  }
}
