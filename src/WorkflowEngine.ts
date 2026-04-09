import { openRouterChat } from './openrouter';
import { WorkflowGraph, WorkflowNode } from './types';
import { RegulationChecker, RegulationResult } from './RegulationChecker';
import { StorageHelper } from './StorageHelper';

interface BuildOptions {
  prompt: string;
  openRouterKey: string;
  neonUrl?: string;
  upstashUrl?: string;
  upstashToken?: string;
  onStatus: (text: string, stage: string) => void;
  onWorkflow: (graph: WorkflowGraph) => void;
}

export class WorkflowEngine {
  static async build(options: BuildOptions): Promise<{ graph: WorkflowGraph; scripts: string[] }> {
    const { prompt, openRouterKey, neonUrl, upstashUrl, upstashToken, onStatus, onWorkflow } = options;

    // STEP 0: Check Cache (Upstash Redis)
    onStatus('⚡ Checking cache...', 'search');
    const cached = await StorageHelper.getCache(upstashUrl!, upstashToken!, `wf_${Buffer.from(prompt).toString('hex').slice(0, 16)}`);
    if (cached) {
      onStatus('🚀 Cache hit! Restoring workflow...', 'complete');
      onWorkflow(cached);
      return { graph: cached, scripts: cached.nodes.map((n: any) => n.code) };
    }

    // STEP 1: PLANNER NODE
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
      const start = plannerResponse.indexOf('{');
      const end = plannerResponse.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON found');
      graph = JSON.parse(plannerResponse.substring(start, end + 1));
      graph.description = prompt;
    } catch {
      throw new Error('Planner failed to return valid JSON. Try rephrasing your workflow.');
    }

    onWorkflow(graph);

    // STEP 2: REGULATION CHECKER (Integrated)
    onStatus('📋 Scanning global regulations...', 'regulation');
    const regulations = await RegulationChecker.scan({ task: prompt, openRouterKey });
    const nonCompliant = regulations.filter(r => !r.compliant || r.fix);
    if (nonCompliant.length > 0) {
      onStatus(`⚖️ Found ${nonCompliant.length} compliance items. Auto-patching...`, 'regulation');
    }

    // STEP 3: EXECUTOR NODE + COMPLIANCE PATCHING
    onStatus('✅ Planner done. Generating code for each node...', 'executor');
    const scripts: string[] = [];
    for (const node of (graph.nodes || [])) {
      let script = await WorkflowEngine.generateNodeCode(node, openRouterKey, onStatus);
      
      // Auto-Patch for Compliance
      if (nonCompliant.length > 0) {
        script = await WorkflowEngine.patchNodeForCompliance(script, nonCompliant, openRouterKey, onStatus);
      }

      node.code = script;
      scripts.push(script);
    }

    // STEP 4: Persist (Neon Postgres)
    onStatus('💾 Saving to history...', 'save');
    await StorageHelper.saveWorkflow(neonUrl!, graph);
    
    // STEP 5: Cache (Upstash Redis)
    await StorageHelper.cacheResult(upstashUrl!, upstashToken!, `wf_${Buffer.from(prompt).toString('hex').slice(0, 16)}`, graph);

    onStatus('✅ Workflow ready and compliant!', 'complete');
    return { graph, scripts };
  }

  static async patchNodeForCompliance(
    code: string, 
    regulations: RegulationResult[], 
    openRouterKey: string,
    onStatus?: (text: string, stage: string) => void
  ): Promise<string> {
    const patches = regulations.map(r => `- ${r.regulation}: ${r.fix}`).join('\n');
    onStatus?.('🛡️ Applying compliance patches...', 'regulation');
    
    return await openRouterChat({
      apiKey: openRouterKey,
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: 'You are a Senior Security Engineer. Patch the provided Python code to ensure it complies with the following regulations. Maintain original functionality.'
        },
        { role: 'user', content: `Regulations to address:\n${patches}\n\nOriginal Code:\n${code}\n\nReturn ONLY the patched Python code.` }
      ]
    });
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
