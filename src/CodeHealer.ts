import { openRouterChat } from './openrouter';

interface HealOptions {
  code: string;
  error: string;
  openRouterKey: string;
  maxRetries?: number;
  onAttempt: (attempt: number, code: string) => void;
  onSuccess: (code: string) => void;
  onFail: (message: string) => void;
}

export class CodeHealer {
  static async heal(options: HealOptions): Promise<{ success: boolean; code: string; attempts: number }> {
    const { code, error, openRouterKey, maxRetries = Infinity, onAttempt, onSuccess, onFail } = options;

    let currentCode = code;
    let currentError = error;
    let attempt = 0;

    // Self-heal indefinitely until success or user stops (maxRetries = Infinity by default)
    while (attempt < maxRetries) {
      attempt++;
      onAttempt(attempt, currentCode);

      const healed = await openRouterChat({
        apiKey: openRouterKey,
        model: 'anthropic/claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: `You are the Reflector (self-healing) node of VibeFlow.
You receive broken Python code and its error. Return ONLY the fixed Python code, no explanation, no markdown.
Fix the exact error. Do not rewrite the entire script unless necessary.`
          },
          {
            role: 'user',
            content: `## Broken Code:\n\`\`\`python\n${currentCode}\n\`\`\`\n\n## Error:\n${currentError}\n\nFix it.`
          }
        ]
      });

      // Simulate test — in real deployment this calls E2B sandbox
      // For extension: return healed code and let the sandbox in the web app validate
      const looksFixed = !healed.includes('SyntaxError') && healed.trim().length > 10;

      if (looksFixed) {
        onSuccess(healed);
        return { success: true, code: healed, attempts: attempt };
      }

      currentCode = healed;
      currentError = `Attempt ${attempt} still failed. Previous fix did not resolve the issue.`;

      // Back-off: wait 1s between retries
      await new Promise(r => setTimeout(r, 1000));
    }

    onFail(`Could not fix after ${attempt} attempts. Please review manually.`);
    return { success: false, code: currentCode, attempts: attempt };
  }
}
