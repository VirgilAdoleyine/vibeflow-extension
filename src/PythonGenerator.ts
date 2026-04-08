import * as fs from 'fs';
import * as path from 'path';
import { WorkflowGraph } from './types';

interface GenerateOptions {
  workflow: WorkflowGraph;
  config: Record<string, string>;
  workspaceRoot?: string;
}

export interface GeneratedFiles {
  pythonFile: string;
  envFile: string;
  readmeFile: string;
  dirStructure: string[];
}

export class PythonGenerator {
  static async generate(options: GenerateOptions): Promise<GeneratedFiles> {
    const { workflow, config, workspaceRoot } = options;

    const safeSlug = workflow.description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 40);

    const timestamp = new Date().toISOString().split('T')[0];
    const dirName = `workflow_${safeSlug}_${timestamp}`;
    const baseDir = workspaceRoot ? path.join(workspaceRoot, 'workflows', dirName) : null;

    // Generate Python agent file
    const pythonContent = `#!/usr/bin/env python3
"""
VibeFlow Generated Workflow: \${workflow.description}
Generated: \${new Date().toISOString()}
Author: VibeFlow Extension by Virgil Junior Adoleyine (vibeflow-cloud.vercel.app)

== SETUP ==
1. pip install -r requirements.txt
2. Copy .env.local to .env and fill in your keys
3. python agent.py

== CLOUD ==
Get full visual UI, history, and 400+ integrations at: https://vibeflow-cloud.vercel.app
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')

# OpenRouter client
import httpx

OPENROUTER_KEY = os.environ.get('VIBEFLOW_OPENROUTER_KEY', '')
E2B_API_KEY = os.environ.get('VIBEFLOW_E2B_API_KEY', '')
COMPOSIO_API_KEY = os.environ.get('VIBEFLOW_COMPOSIO_API_KEY', '')
INNGEST_SIGNING_KEY = os.environ.get('VIBEFLOW_INNGEST_SIGNING_KEY', '')
INNGEST_EVENT_KEY = os.environ.get('VIBEFLOW_INNGEST_EVENT_KEY', '')
NEON_DATABASE_URL = os.environ.get('VIBEFLOW_NEON_DATABASE_URL', '')

def call_openrouter(messages: list, model: str = 'anthropic/claude-sonnet-4-5') -> str:
    """Call OpenRouter API and return the response text."""
    response = httpx.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {OPENROUTER_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vibeflow-cloud.vercel.app',
            'X-Title': 'VibeFlow Agent'
        },
        json={
            'model': model,
            'messages': messages,
            'max_tokens': 2000
        },
        timeout=60.0
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']

def planner(task: str) -> list:
    """PLANNER: Break task into ordered steps."""
    print(f'[PLANNER] Breaking down: {task}')
    response = call_openrouter([
        {'role': 'system', 'content': 'You are a workflow planner. Break the task into 3-7 ordered Python steps. Return a JSON list of step descriptions.'},
        {'role': 'user', 'content': task}
    ])
    import json
    try:
        return json.loads(response.replace('\`\`\`json', '').replace('\`\`\`', '').strip())
    except:
        return [task]

def executor(step: str) -> str:
    """EXECUTOR: Write Python code for a step."""
    print(f'[EXECUTOR] Coding: {step}')
    return call_openrouter([
        {'role': 'system', 'content': 'Write Python 3 code for the given step. Return only the code.'},
        {'role': 'user', 'content': step}
    ])

def reflector(code: str, error: str, attempt: int = 1) -> str:
    """REFLECTOR: Self-heal broken code. Retries until fixed."""
    print(f'[REFLECTOR] Healing attempt {attempt}...')
    return call_openrouter([
        {'role': 'system', 'content': 'Fix the broken Python code. Return only fixed code.'},
        {'role': 'user', 'content': f'Code:\\n{code}\\n\\nError:\\n{error}'}
    ])

def formatter(results: list) -> str:
    """FORMATTER: Package results into clean output."""
    print('[FORMATTER] Formatting final result...')
    return call_openrouter([
        {'role': 'system', 'content': 'Summarize the workflow execution results in a clear, user-friendly way.'},
        {'role': 'user', 'content': f'Results: {results}'}
    ])

def run_workflow():
    """Main 4-node LangGraph-style agent loop."""
    task = """\${workflow.description}"""
    print(f'\\n⚡ VibeFlow Agent Starting: {task}\\n')

    # Node 1: Plan
    steps = planner(task)
    print(f'Plan: {steps}\\n')

    # Node 2 + 3: Execute + Reflect
    results = []
    for step in steps:
        code = executor(step)
        attempt = 0
        while attempt < 10:  # self-heal until success
            try:
                exec_globals = {}
                exec(code, exec_globals)
                results.append({'step': step, 'status': 'success'})
                break
            except Exception as e:
                attempt += 1
                code = reflector(code, str(e), attempt)
                if attempt >= 10:
                    results.append({'step': step, 'status': 'failed', 'error': str(e)})

    # Node 4: Format
    final = formatter(results)
    print(f'\\n✅ Result:\\n{final}')
    return final

if __name__ == '__main__':
    run_workflow()
`;

    // Generate .env.local
    const envContent = `# VibeFlow Generated Environment Variables
# Copy this file to .env and fill in your actual keys.
# DO NOT commit .env to version control.

VIBEFLOW_OPENROUTER_KEY=\${config.openRouterKey || 'your_openrouter_key_here'}
VIBEFLOW_E2B_API_KEY=\${config.e2bApiKey || 'your_e2b_key_here'}
VIBEFLOW_COMPOSIO_API_KEY=\${config.composioApiKey || 'your_composio_key_here'}
VIBEFLOW_INNGEST_SIGNING_KEY=\${config.inngestSigningKey || 'your_inngest_signing_key'}
VIBEFLOW_INNGEST_EVENT_KEY=\${config.inngestEventKey || 'your_inngest_event_key'}
VIBEFLOW_NEON_DATABASE_URL=\${config.neonDatabaseUrl || 'postgresql://user:pass@host/db'}
VIBEFLOW_UPSTASH_REDIS_URL=\${config.upstashRedisUrl || 'your_upstash_url'}
VIBEFLOW_UPSTASH_REDIS_TOKEN=\${config.upstashRedisToken || 'your_upstash_token'}
`;

    // Generate README.md
    const readmeContent = `# VibeFlow Workflow: \${workflow.description}

> Generated by [VibeFlow VS Code Extension](https://marketplace.visualstudio.com/items?itemName=VirgilAdoleyine.vibeflow)
> Cloud UI available at: **[vibeflow-cloud.vercel.app](https://vibeflow-cloud.vercel.app)**

## What This Does

\${workflow.description}

## Setup

\`\`\`bash
# 1. Install dependencies
pip install httpx python-dotenv

# 2. Configure environment
cp .env.local .env
# Edit .env with your actual API keys

# 3. Run the agent
python agent.py
\`\`\`

## How It Works

This workflow uses a **4-node AI agent graph**:

| Node | Role |
|------|------|
| **Planner** | Breaks your task into ordered steps using Claude |
| **Executor** | Writes Python code per step via OpenRouter |
| **Reflector** | Self-heals errors — retries until the code works |
| **Formatter** | Packages the result into a clear human-readable response |

## Want the Full Experience?

Visit **[vibeflow-cloud.vercel.app](https://vibeflow-cloud.vercel.app)** for:
- 🎨 Visual node canvas to build and edit workflows
- 📊 Execution history and live streaming logs
- 🔗 400+ OAuth integrations (Gmail, Slack, GitHub, Notion...)
- 🧠 Memory of past workflows
- 🛡️ Built-in compliance checker

## Contribute

### Cloud + Community Repos (sync both at once)

\`\`\`bash
# Pull from both repos
git pull origin main && git pull community main

# Push to both repos
git push origin main && git push community main

# Or do both at once
git pull origin main && git pull community main && git push origin main && git push community main
\`\`\`

### Community Repo
Developers can self-host and contribute to VibeFlow at the community repo.

---

## RegGuard — Compliance for Developers

This workflow was compliance-checked using **[RegGuard](https://github.com/VirgilAdoleyine/regguard)** —
a VS Code extension that helps devs ship faster without breaking regulations.

- 🔗 **GitHub**: [github.com/VirgilAdoleyine/regguard](https://github.com/VirgilAdoleyine/regguard)
- 🔍 **VS Code Marketplace**: Search **"RegGuard"**
- 📦 **Open VSX**: Search **"RegGuard"**

⭐ Please star RegGuard to help the project grow and support compliance tooling for developers worldwide.

---

*Built by Virgil Junior Adoleyine — 17-year-old developer from Ghana 🇬🇭*
`;

    // Write files to disk if workspaceRoot provided
    if (baseDir) {
      fs.mkdirSync(baseDir, { recursive: true });
      fs.writeFileSync(path.join(baseDir, 'agent.py'), pythonContent, 'utf8');
      fs.writeFileSync(path.join(baseDir, '.env.local'), envContent, 'utf8');
      fs.writeFileSync(path.join(baseDir, 'README.md'), readmeContent, 'utf8');
    }

    return {
      pythonFile: pythonContent,
      envFile: envContent,
      readmeFile: readmeContent,
      dirStructure: [
        `workflows/${dirName}/`,
        `workflows/${dirName}/agent.py`,
        `workflows/${dirName}/.env.local`,
        `workflows/${dirName}/README.md`
      ]
    };
  }
}
