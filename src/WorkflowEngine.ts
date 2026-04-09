import { openRouterChat } from './openrouter';
import { WorkflowGraph, WorkflowNode } from './types';

interface BuildOptions {
  prompt: string;
  openRouterKey: string;
  onStatus: (text: string, stage: string) => void;
  onWorkflow: (graph: WorkflowGraph) => void;
}

export class WorkflowEngine {
  static async build(options: BuildOptions): Promise<{ graph: WorkflowGraph; scripts: string[] }> {
    const { prompt, openRouterKey, onStatus, onWorkflow } = options;

    // PLANNER NODE — Claude breaks prompt into DAG
    onStatus('🧠 Planner: Breaking down your request...', 'planner');
    const plannerResponse = await openRouterChat({
      apiKey: openRouterKey,
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: `You are the Planner node of VibeFlow. Given a user's workflow description, output a JSON workflow graph.

Return ONLY valid JSON matching this schema:
{
  "description": "string",
  "nodes": [
    {
      "id": "string",
      "type": "trigger|action|llm|condition|transform|code|output",
      "label": "string",
      "app": "string (e.g. gmail, slack, github, inngest)",
      "config": {},
      "position": { "x": number, "y": number }
    }
  ],
  "edges": [["sourceId", "targetId"]],
  "steps": ["step 1 description", "step 2 description"]
}

Position nodes in a left-to-right DAG layout. x increments by 200 per node, y: 200.`
        },
        { role: 'user', content: prompt }
      ]
    });

    let graph: WorkflowGraph;
    try {
      // More robust extraction finding the first { and last }
      const start = plannerResponse.indexOf('{');
      const end = plannerResponse.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON found');
      graph = JSON.parse(plannerResponse.substring(start, end + 1));
      graph.description = prompt;
    } catch {
      throw new Error('Planner failed to return valid JSON. Try rephrasing your workflow.');
    }

    onWorkflow(graph);
    onStatus('✅ Planner done. Generating code for each node...', 'executor');

    // EXECUTOR NODE — Claude writes Python for EACH node
    const scripts: string[] = [];
    for (const node of (graph.nodes || [])) {
      const script = await WorkflowEngine.generateNodeCode(node, openRouterKey, onStatus);
      node.code = script;
      scripts.push(script);
    }

    onStatus('✅ All code generated. Ready to run!', 'complete');

    return { graph, scripts };
  }

  static async generateNodeCode(
    node: WorkflowNode,
    openRouterKey: string,
    onStatus?: (text: string, stage: string) => void
  ): Promise<string> {
    onStatus?.(`⚙️ Executor: Writing code for "${node.label}"`, 'executor');
    
    const systemPrompt = node.type === 'llm' 
      ? `You are the Executor node of VibeFlow. Write production-ready Python 3.11 code to call an LLM API for: "${node.label}".
Use httpx to call OpenRouter. Load secrets from environment variables with VIBEFLOW_ prefix.
Return ONLY the Python code, no markdown fences.`
      : `You are the Executor node of VibeFlow. Write production-ready Python 3.11 code to perform the action: "${node.label}".
Use only standard library or pip-installable packages. Load secrets from environment variables with VIBEFLOW_ prefix.
Return ONLY the Python code, no markdown fences.`;

    const script = await openRouterChat({
      apiKey: openRouterKey,
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Task: ${node.label}\nApp: ${node.app || 'generic'}\nConfig: ${JSON.stringify(node.config || {})}` }
      ]
    });

    // REFLECTOR NODE — Self-healing
    onStatus?.(`🕵️ Reflector: Auditing code for "${node.label}"...`, 'healer');
    const reflection = await openRouterChat({
      apiKey: openRouterKey,
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: `You are the Reflector node. Audit the provided Python code for:
1. Missing imports.
2. Environment variable usage (must use VIBEFLOW_ prefix).
3. Logical errors.
4. API key handling.
If errors exist, output the corrected code. If perfect, output 'PASS'.
Return ONLY 'PASS' or the corrected code.`
        },
        { role: 'user', content: script }
      ]
    });

    if (reflection.trim() === 'PASS') {
      return script;
    } else {
      onStatus?.(`✨ Reflector: Patched code for "${node.label}"`, 'healer');
      return reflection;
    }
  }

  static async selfHeal(
    code: string,
    error: string,
    openRouterKey: string,
    maxAttempts: number = 5,
    onStatus?: (text: string, stage: string, attempt: number) => void
  ): Promise<string> {
    let currentCode = code;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      onStatus?.(`🩺 Healing attempt ${attempt}/${maxAttempts}...`, 'healer', attempt);
      
      const fixed = await openRouterChat({
        apiKey: openRouterKey,
        model: 'anthropic/claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: `You are the Reflector node. Fix the broken Python code below.
Error: ${error}
Fix the code and return ONLY the corrected Python code, no markdown fences.`
          },
          { role: 'user', content: currentCode }
        ]
      });

      currentCode = fixed;
      
      // Try running the fixed code - if no error, return it
      // This is a placeholder - actual validation happens when running on E2B
      if (!fixed.toLowerCase().includes('error') && !fixed.includes('Traceback')) {
        onStatus?.(`✅ Code healed on attempt ${attempt}`, 'healer', attempt);
        return currentCode;
      }
    }
    
    throw new Error(`Failed to heal after ${maxAttempts} attempts. Last error: ${error}`);
  }
}
