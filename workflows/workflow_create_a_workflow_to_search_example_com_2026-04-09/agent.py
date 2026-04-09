#!/usr/bin/env python3
"""
VibeFlow Generated Workflow: ${workflow.description}
Generated: ${new Date().toISOString()}
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
        return json.loads(response.replace('```json', '').replace('```', '').strip())
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
        {'role': 'user', 'content': f'Code:\n{code}\n\nError:\n{error}'}
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
    task = """${workflow.description}"""
    print(f'\n⚡ VibeFlow Agent Starting: {task}\n')

    # Node 1: Plan
    steps = planner(task)
    print(f'Plan: {steps}\n')

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
    print(f'\n✅ Result:\n{final}')
    return final

if __name__ == '__main__':
    run_workflow()
