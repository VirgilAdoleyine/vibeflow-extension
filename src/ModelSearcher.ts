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
        model: 'perplexity/sonar-reasoning-pro',
        messages: [
          {
            role: 'user',
            content: `Perform a deep research search on OpenRouter's model catalog to find the absolute TOP 5 AI models for this specific automation task: "${task}".

Analyze based on:
1. Coding proficiency (Python 3.11+)
2. Tool use and function calling accuracy
3. Latency vs reasoning depth
4. Context window requirements

For each model return:
- id: OpenRouter model ID (exact slug)
- name: Human-friendly name
- provider: Provider name (e.g., Anthropic, Google, Meta)
- strengths: Array of 3 specific reasons why it fits THIS task
- recommended: true for the #1 best fit
- openRouterSlug: Same as ID

Return ONLY a valid JSON array.`
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
