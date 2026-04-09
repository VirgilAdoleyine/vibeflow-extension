import { Sandbox } from 'e2b';
import * as vscode from 'vscode';
import { trackEvent } from './telemetry';

interface RunOptions {
  code: string;
  e2bApiKey: string;
  envs?: Record<string, string>;
  onOutput?: (text: string) => void;
  onError?: (text: string) => void;
}

export class E2BRunner {
  private static sandbox: Sandbox | null = null;

  static async runCode(options: RunOptions): Promise<string> {
    const { code, e2bApiKey, envs, onOutput, onError } = options;

    if (!e2bApiKey) {
      throw new Error('E2B API key not set. Set vibeflow-orch.e2bApiKey in VS Code Settings.');
    }

    trackEvent('e2b_execution_started');

    try {
      const sandbox = await Sandbox.create({
        apiKey: e2bApiKey,
        onStdout: (data) => {
          const text = data.toString();
          onOutput?.(text);
        },
        onStderr: (data) => {
          const text = data.toString();
          onError?.(text);
        }
      });

      const exit = await sandbox.process.exec(['python3', '-c', code], { env: envs });
      const output = exit.stdout + exit.stderr;

      await sandbox.close();
      
      trackEvent('e2b_execution_success');
      return output;
    } catch (error: any) {
      trackEvent('e2b_execution_failed', { error: error.message });
      throw error;
    }
  }

  static async runWorkflowFiles(
    dirPath: string, 
    e2bApiKey: string,
    envs?: Record<string, string>,
    onOutput?: (text: string) => void,
    onError?: (text: string) => void
  ): Promise<string> {
    if (!e2bApiKey) {
      throw new Error('E2B API key not set. Set vibeflow-orch.e2bApiKey in VS Code Settings.');
    }

    trackEvent('e2b_workflow_started');

    try {
      const sandbox = await Sandbox.create({
        apiKey: e2bApiKey,
        onStdout: (data) => {
          const text = data.toString();
          onOutput?.(text);
        },
        onStderr: (data) => {
          const text = data.toString();
          onError?.(text);
        }
      });

      // Upload the workflow files
      await sandbox.uploadDir(dirPath, '/home/user/workflow');

      // Run the agent.py
      const exit = await sandbox.process.exec([
        'bash', '-c', 
        'cd /home/user/workflow && pip install -r requirements.txt 2>/dev/null && python3 agent.py'
      ], { env: envs });

      const output = exit.stdout + exit.stderr;
      await sandbox.close();

      trackEvent('e2b_workflow_success');
      return output;
    } catch (error: any) {
      trackEvent('e2b_workflow_failed', { error: error.message });
      throw error;
    }
  }
}
