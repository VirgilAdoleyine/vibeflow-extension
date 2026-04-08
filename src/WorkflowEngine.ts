import { openRouterChat } from './openrouter';
import { WorkflowGraph } from './types';

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
    onStatus('✅ Planner done. Executing steps...', 'executor');

    // EXECUTOR NODE — Claude writes Python per step
    const scripts: string[] = [];
    for (const step of (graph.steps || [])) {
      onStatus(`⚙️ Executor: Writing code for "${step}"`, 'executor');
      const script = await openRouterChat({
        apiKey: openRouterKey,
        model: 'anthropic/claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: `You are the Executor node of VibeFlow. Write production-ready Python 3.11 code for the given workflow step.
Use only standard library or pip-installable packages. Load secrets from environment variables.
Return ONLY the Python code, no markdown fences.`
          },
          { role: 'user', content: `Write Python for this step: ${step}\n\nFull workflow context: ${JSON.stringify(graph)}` }
        ]
      });

      // REFLECTOR NODE — Self-healing logic
      onStatus(`🕵️ Reflector: Auditing code for "${step}"...`, 'healer');
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
If errors exist, output the corrected code. If perfect, output 'PASS'.
Return ONLY 'PASS' or the corrected code.`
          },
          { role: 'user', content: script }
        ]
      });

      if (reflection.trim() === 'PASS') {
        scripts.push(script);
      } else {
        onStatus(`✨ Reflector: Patched code for "${step}"`, 'healer');
        scripts.push(reflection);
      }
    }

    onStatus('✅ All steps generated. Formatting result...', 'formatter');

    // FORMATTER NODE
    const formatted = await openRouterChat({
      apiKey: openRouterKey,
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: 'You are the Formatter node. Summarize what the workflow does in 2-3 sentences for the user. Be friendly and clear.'
        },
        {
          role: 'user',
          content: `Workflow: ${JSON.stringify(graph)}\nGenerated ${scripts.length} scripts.`
        }
      ]
    });

    onStatus(`🎉 ${formatted}`, 'complete');
    return { graph, scripts };
  }
}
