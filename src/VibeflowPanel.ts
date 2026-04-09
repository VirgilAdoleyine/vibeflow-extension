import * as vscode from 'vscode';
import { WorkflowEngine } from './WorkflowEngine';
import { ModelSearcher } from './ModelSearcher';
import { RegulationChecker } from './RegulationChecker';
import { PythonGenerator } from './PythonGenerator';
import { E2BRunner } from './E2BRunner';
import { WorkflowGraph, VibeMessage } from './types';
import { trackEvent } from './telemetry';

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
        trackEvent('workflow_created');
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
        trackEvent('compliance_check_started');
        this._post({ command: 'status', text: '📋 Scanning global regulations...', stage: 'regulation' });
        const regulations = await RegulationChecker.scan({
          task: message.prompt || (this._currentWorkflow?.description || ''),
          openRouterKey
        });
        this._post({ command: 'regulationsFound', regulations });
        trackEvent('compliance_check_completed');
        break;
      }

      case 'runWorkflow': {
        trackEvent('workflow_run_started');
        this._post({ command: 'status', text: '🚀 Starting execution on E2B...', stage: 'executor' });
        const e2bApiKey = config.get<string>('e2bApiKey') || '';
        
        if (!e2bApiKey) {
          this._post({ command: 'error', text: 'E2B API key not set. Set vibeflow-orch.e2bApiKey in VS Code Settings.' });
          return;
        }
        
        if (!this._currentWorkflow?.nodes?.length) {
          this._post({ command: 'error', text: 'No workflow built. Build a workflow first.' });
          return;
        }
        
        try {
          // Run each node's code on E2B in order
          const nodes = this._currentWorkflow.nodes;
          
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            this._post({ command: 'status', text: `🏃 Running node ${i + 1}/${nodes.length}: ${node.label}`, stage: 'executor' });
            
            if (!node.code) {
              this._post({ command: 'status', text: `⚠️ Node "${node.label}" has no code. Skipping.`, stage: 'executor' });
              continue;
            }
            
            let maxAttempts = 5;
            let attempt = 0;
            let success = false;
            let lastError = '';
            
            // Self-healing loop
            while (attempt < maxAttempts && !success) {
              attempt++;
              
              try {
                const output = await E2BRunner.runCode({
                  code: node.code,
                  e2bApiKey,
                  onOutput: (text) => this._post({ command: 'status', text: text, stage: 'executor' }),
                  onError: (text) => { lastError = text; throw new Error(text); }
                });
                
                success = true;
                this._post({ command: 'status', text: `✅ Node "${node.label}" completed`, stage: 'executor' });
                trackEvent('node_execution_success', { nodeId: node.id, nodeLabel: node.label });
                
              } catch (execError: any) {
                lastError = execError.message;
                this._post({ command: 'status', text: `❌ Node "${node.label}" failed: ${lastError}`, stage: 'executor' });
                this._post({ command: 'status', text: `🩺 Self-healing... attempt ${attempt}/${maxAttempts}`, stage: 'healer' });
                
                // Try to heal the code
                const healedCode = await WorkflowEngine.selfHeal(
                  node.code,
                  lastError,
                  openRouterKey,
                  3,
                  (t, s, a) => this._post({ command: 'status', text: t, stage: s })
                );
                
                node.code = healedCode;
                this._post({ command: 'nodeCodeUpdated', nodeId: node.id, code: healedCode });
                
                if (attempt >= maxAttempts) {
                  throw new Error(`Node "${node.label}" failed after ${maxAttempts} healing attempts. Last error: ${lastError}`);
                }
              }
            }
          }
          
          this._post({ command: 'status', text: '✅ All nodes executed successfully!', stage: 'complete' });
          this._post({ command: 'executionFinished', success: true });
          trackEvent('workflow_run_success');
        } catch (e: any) {
          trackEvent('workflow_run_failed', { error: e.message });
          this._post({ command: 'error', text: e.message });
        }
        break;
      }

      case 'updateNodeCode': {
        // Update a node's code when user edits it in the canvas
        if (!message.nodeId || !message.code) {
          this._post({ command: 'error', text: 'Missing nodeId or code.' });
          return;
        }
        
        const node = this._currentWorkflow?.nodes.find(n => n.id === message.nodeId);
        if (node) {
          node.code = message.code;
          this._post({ command: 'nodeCodeUpdated', nodeId: message.nodeId, code: message.code });
          this._post({ command: 'status', text: `💾 Code saved for node "${node.label}"`, stage: 'save' });
        }
        break;
      }

      case 'getNodeCode': {
        // Get code for a specific node
        if (!message.nodeId) {
          this._post({ command: 'error', text: 'Missing nodeId.' });
          return;
        }
        
        const node = this._currentWorkflow?.nodes.find(n => n.id === message.nodeId);
        if (node) {
          this._post({ command: 'nodeCodeResponse', nodeId: message.nodeId, code: node.code || '', label: node.label });
        }
        break;
      }

      case 'setupComposio': {
        trackEvent('composio_setup_clicked');
        vscode.window.showInformationMessage('Opening Composio App Setup...');
        vscode.env.openExternal(vscode.Uri.parse('https://app.composio.dev/apps'));
        break;
      }

      case 'generateFiles': {
        trackEvent('files_generated');
        if (!this._currentWorkflow) {
          this._post({ command: 'error', text: 'Build a workflow first before generating files.' });
          return;
        }
        this._post({ command: 'status', text: '📁 Generating .py + .env.local + README...', stage: 'generate' });
        
        // Get all config including user-provided env vars
        const allConfigKeys = Object.keys(config).filter(k => k.startsWith('vibeflow-orch.'));
        const allConfig: Record<string, string> = {};
        for (const key of allConfigKeys) {
          allConfig[key.replace('vibeflow-orch.', '')] = config.get<string>(key) || '';
        }
        // Also include any custom env vars the user wants to pass
        const customEnvVars = config.get<string>('customEnvVars') || '';
        
        const files = await PythonGenerator.generate({
          workflow: this._currentWorkflow,
          config: allConfig,
          customEnvVars: customEnvVars,
          workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath
        });
        this._post({ command: 'filesGenerated', files });
        break;
      }

      case 'runWorkflowFiles': {
        trackEvent('e2b_workflow_files_started');
        const e2bApiKey = config.get<string>('e2bApiKey') || '';
        
        if (!e2bApiKey) {
          this._post({ command: 'error', text: 'E2B API key not set. Set vibeflow-orch.e2bApiKey in VS Code Settings.' });
          return;
        }
        
        if (!message.dirPath) {
          this._post({ command: 'error', text: 'No workflow directory provided.' });
          return;
        }
        
        this._post({ command: 'status', text: '🚀 Running workflow files on E2B...', stage: 'executor' });
        
        try {
          const output = await E2BRunner.runWorkflowFiles(
            message.dirPath,
            e2bApiKey,
            (text) => this._post({ command: 'status', text, stage: 'executor' }),
            (text) => this._post({ command: 'status', text: `Error: ${text}`, stage: 'executor' })
          );
          
          this._post({ command: 'status', text: '✅ Workflow execution complete!', stage: 'complete' });
          this._post({ command: 'executionFinished', success: true, output });
          trackEvent('e2b_workflow_files_success');
        } catch (e: any) {
          trackEvent('e2b_workflow_files_failed', { error: e.message });
          this._post({ command: 'error', text: e.message });
        }
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
