import * as vscode from 'vscode';
import { WorkflowEngine } from './WorkflowEngine';
import { ModelSearcher } from './ModelSearcher';
import { RegulationChecker } from './RegulationChecker';
import { PythonGenerator } from './PythonGenerator';
import { WorkflowGraph, VibeMessage } from './types';

export class VibeflowPanel {
  public static currentPanel: VibeflowPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private _currentWorkflow: WorkflowGraph | null = null;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (VibeflowPanel.currentPanel) {
      VibeflowPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'vibeflow',
      '⚡ VibeFlow',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          context.extensionUri,
          vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist'),
          vscode.Uri.joinPath(context.extensionUri, 'media')
        ]
      }
    );

    VibeflowPanel.currentPanel = new VibeflowPanel(panel, context);
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._panel.webview.html = this._getHtmlContent();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message: VibeMessage) => {
        await this._handleMessage(message);
      },
      null,
      this._disposables
    );
  }

  private async _handleMessage(message: VibeMessage) {
    const config = vscode.workspace.getConfiguration('vibeflow-orch');
    const openRouterKey = config.get<string>('openRouterKey') || '';
    const perplexityKey = config.get<string>('perplexityKey') || '';

    switch (message.command) {
      case 'buildWorkflow': {
        this._post({ command: 'status', text: '🧠 Planning workflow...', stage: 'planner' });
        try {
          const result = await WorkflowEngine.build({
            prompt: message.prompt!,
            openRouterKey,
            onStatus: (text, stage) => this._post({ command: 'status', text, stage }),
            onWorkflow: (graph) => {
              this._currentWorkflow = graph;
              this._post({ command: 'renderWorkflow', workflow: graph });
            }
          });
          this._post({ command: 'workflowComplete', result });
        } catch (e: any) {
          this._post({ command: 'error', text: e.message });
        }
        break;
      }

      case 'searchModels': {
        this._post({ command: 'status', text: '🔍 Searching best models via Perplexity...', stage: 'search' });
        const models = await ModelSearcher.search({
          task: message.prompt || 'general workflow automation',
          openRouterKey
        });
        this._post({ command: 'modelsFound', models });
        break;
      }

      case 'checkRegulations': {
        this._post({ command: 'status', text: '📋 Scanning global regulations...', stage: 'regulation' });
        const regulations = await RegulationChecker.scan({
          task: message.prompt || (this._currentWorkflow?.description || ''),
          openRouterKey
        });
        this._post({ command: 'regulationsFound', regulations });
        break;
      }

      case 'runWorkflow': {
        this._post({ command: 'status', text: '🚀 Starting execution...', stage: 'executor' });
        // In a real scenario, this would use E2B or a local child process.
        // For now, we simulate execution and provide feedback.
        try {
          if (!message.workflow?.steps) throw new Error('No steps to run.');
          for (const step of message.workflow.steps) {
            this._post({ command: 'status', text: `🏃 Running: ${step}`, stage: 'executor' });
            await new Promise(r => setTimeout(r, 1500)); // Simulate work
          }
          this._post({ command: 'status', text: '✅ Execution complete!', stage: 'complete' });
          this._post({ command: 'executionFinished', success: true });
        } catch (e: any) {
          this._post({ command: 'error', text: e.message });
        }
        break;
      }

      case 'setupComposio': {
        vscode.window.showInformationMessage('Opening Composio App Setup...');
        vscode.env.openExternal(vscode.Uri.parse('https://app.composio.dev/apps'));
        break;
      }

      case 'generateFiles': {
        if (!this._currentWorkflow) {
          this._post({ command: 'error', text: 'Build a workflow first before generating files.' });
          return;
        }
        this._post({ command: 'status', text: '📁 Generating .py + .env.local + README...', stage: 'generate' });
        const files = await PythonGenerator.generate({
          workflow: this._currentWorkflow,
          config: Object.fromEntries(
            ['openRouterKey', 'e2bApiKey', 'composioApiKey', 'inngestSigningKey', 'inngestEventKey',
              'neonDatabaseUrl', 'upstashRedisUrl', 'upstashRedisToken'].map(k => [k, config.get<string>(k) || ''])
          ),
          workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath
        });
        this._post({ command: 'filesGenerated', files });
        break;
      }

      case 'healCode': {
        this._post({ command: 'status', text: '🩺 Self-healing code...', stage: 'healer' });
        // CodeHealer handles retries up to user cancellation
        const { CodeHealer } = await import('./CodeHealer');
        const healed = await CodeHealer.heal({
          code: message.code!,
          error: message.error!,
          openRouterKey,
          onAttempt: (n, code) => this._post({ command: 'healAttempt', attempt: n, code }),
          onSuccess: (code) => this._post({ command: 'healSuccess', code }),
          onFail: (msg) => this._post({ command: 'healFailed', text: msg })
        });
        this._post({ command: 'healResult', healed });
        break;
      }

      case 'openExternal': {
        vscode.env.openExternal(vscode.Uri.parse(message.url!));
        break;
      }

      case 'showNotification': {
        vscode.window.showInformationMessage(message.text || '');
        break;
      }
    }
  }

  public sendPrompt(prompt: string) {
    this._post({ command: 'injectPrompt', prompt });
  }

  public sendCommand(command: string) {
    this._post({ command });
  }

  private _post(message: any) {
    this._panel.webview.postMessage(message);
  }

  private _getHtmlContent(): string {
    const webview = this._panel.webview;
    const distUri = vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist');
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'assets', 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'assets', 'index.css'));
    const nonce = getNonce();
    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${cspSource}; img-src ${cspSource} data:; font-src ${cspSource}; connect-src ${cspSource} https:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>VibeFlow</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    VibeflowPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
