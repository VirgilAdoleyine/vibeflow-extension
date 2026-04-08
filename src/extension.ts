import * as vscode from 'vscode';
import { VibeflowPanel } from './VibeflowPanel';
import { GitHelper } from './GitHelper';

export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('VibeFlow activated — AI Workflow Builder by Virgil Junior Adoleyine 🇬🇭');

    // Show welcome notification on first install
    const hasShownWelcome = context.globalState.get('vibeflow-orch.welcomeShown');
    if (!hasShownWelcome) {
      vscode.window.showInformationMessage(
        '⚡ VibeFlow is ready! Describe a workflow in plain English and watch AI build it.',
        'Open VibeFlow',
        'Star RegGuard ⭐'
      ).then(choice => {
        if (choice === 'Open VibeFlow') {
          vscode.commands.executeCommand('vibeflow-orch.open');
        } else if (choice === 'Star RegGuard ⭐') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/VirgilAdoleyine/regguard'));
        }
      });
      context.globalState.update('vibeflow-orch.welcomeShown', true);
    }

    // Register all commands
    const commands = [
      vscode.commands.registerCommand('vibeflow-orch.open', () => {
        try {
          VibeflowPanel.createOrShow(context);
        } catch (e: any) {
          vscode.window.showErrorMessage(`Failed to open VibeFlow: ${e.message}`);
        }
      }),

      vscode.commands.registerCommand('vibeflow-orch.newWorkflow', async () => {
        const prompt = await vscode.window.showInputBox({
          prompt: 'Describe your workflow in plain English',
          placeHolder: 'e.g. Every morning, summarize my Gmail and post to Slack',
          ignoreFocusOut: true
        });
        if (prompt) {
          VibeflowPanel.createOrShow(context);
          VibeflowPanel.currentPanel?.sendPrompt(prompt);
        }
      }),

      vscode.commands.registerCommand('vibeflow-orch.searchModels', () => {
        VibeflowPanel.createOrShow(context);
        VibeflowPanel.currentPanel?.sendCommand('searchModels');
      }),

      vscode.commands.registerCommand('vibeflow-orch.checkRegulations', () => {
        VibeflowPanel.createOrShow(context);
        VibeflowPanel.currentPanel?.sendCommand('checkRegulations');
      }),

      vscode.commands.registerCommand('vibeflow-orch.generateFiles', () => {
        VibeflowPanel.createOrShow(context);
        VibeflowPanel.currentPanel?.sendCommand('generateFiles');
      }),

      vscode.commands.registerCommand('vibeflow-orch.syncRepos', async () => {
        const config = vscode.workspace.getConfiguration('vibeflow-orch');
        const originUrl = config.get<string>('userGitHubRepo');
        const communityUrl = config.get<string>('communityGitRepo');
        if (!originUrl || !communityUrl) {
          vscode.window.showWarningMessage('Set vibeflow-orch.userGitHubRepo and vibeflow-orch.communityGitRepo in settings first.');
          return;
        }
        await GitHelper.syncBothRemotes(originUrl, communityUrl);
      }),

      vscode.commands.registerCommand('vibeflow-orch.contributeRegGuard', () => {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/VirgilAdoleyine/regguard'));
        vscode.window.showInformationMessage(
          '⭐ Thank you! Star RegGuard and contribute to help devs ship compliant code faster.',
          'Open VS Code Marketplace'
        ).then(c => {
          if (c) vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=VirgilAdoleyine.regguard'));
        });
      })
    ];

    context.subscriptions.push(...commands);
  } catch (err: any) {
    vscode.window.showErrorMessage(`VibeFlow failed to activate: ${err.message}`);
  }
}

export function deactivate() { }
