import { openRouterChat } from './openrouter';

interface ScanOptions {
  task: string;
  openRouterKey: string;
}

export interface RegulationResult {
  region: string;
  regulation: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  compliant: boolean;
  fix?: string;
}

export class RegulationChecker {
  static async scan(options: ScanOptions): Promise<RegulationResult[]> {
    const { task, openRouterKey } = options;

    // STEP 1: Perplexity sonar-deep-research via OpenRouter — global regulations
    const perplexityText = await openRouterChat({
      apiKey: openRouterKey,
      model: 'perplexity/sonar-deep-research',
      messages: [{
        role: 'user',
        content: `List the TOP global regulations that apply to this automation workflow: "${task}".

Include: GDPR (EU), CCPA (California), HIPAA (USA), PDPA (Ghana/Africa), SOC2, PCI-DSS, AI Act (EU), and any others relevant.

For each return JSON:
{"region":"...","regulation":"...","severity":"high|medium|low","description":"...","compliant":true/false}

Return ONLY a valid JSON array. No prose.`
      }]
    });

    let regulations: RegulationResult[] = [];
    try {
      regulations = JSON.parse(perplexityText.replace(/```json|```/g, '').trim());
    } catch {
      regulations = [];
    }

    // STEP 2: Grok — trending regulations based on task
    try {
      const grokText = await openRouterChat({
        apiKey: openRouterKey,
        model: 'x-ai/grok-4.20',
        messages: [{
          role: 'user',
          content: `What are the TRENDING or NEW regulations in 2024-2025 that affect this workflow: "${task}"?
Return only a JSON array in the same format:
[{"region":"...","regulation":"...","severity":"high|medium|low","description":"...","compliant":false}]`
        }]
      });
      const trending = JSON.parse(grokText.replace(/```json|```/g, '').trim());
      regulations = [...regulations, ...trending];
    } catch {
      // Grok failed, continue with Perplexity results only
    }

    // STEP 3: Claude — fix non-compliant items
    const nonCompliant = regulations.filter(r => !r.compliant);
    for (const reg of nonCompliant) {
      try {
        const fix = await openRouterChat({
          apiKey: openRouterKey,
          model: 'anthropic/claude-sonnet-4-5',
          messages: [{
            role: 'system',
            content: 'You are a compliance expert. Given a regulation violation, provide a concrete 1-2 sentence code-level fix.'
          }, {
            role: 'user',
            content: `Workflow: "${task}"\nViolation: ${reg.regulation} (${reg.region}) — ${reg.description}\nProvide a specific fix.`
          }]
        });
        reg.fix = fix;
        reg.compliant = true;
      } catch {
        reg.fix = `Review ${reg.regulation} documentation and ensure compliance before deploying.`;
      }
    }

    return regulations;
  }
}
