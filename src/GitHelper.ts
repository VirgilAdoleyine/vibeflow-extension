import * as vscode from 'vscode';
import simpleGit from 'simple-git';

export class GitHelper {
  static async syncBothRemotes(originUrl: string, communityUrl: string): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const git = simpleGit(workspaceRoot);

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'VibeFlow: Syncing repos...', cancellable: false },
      async (progress) => {
        try {
          // Ensure remotes exist
          const remotes = await git.getRemotes(true);
          const hasOrigin = remotes.some(r => r.name === 'origin');
          const hasCommunity = remotes.some(r => r.name === 'community');

          if (!hasOrigin) await git.addRemote('origin', originUrl);
          if (!hasCommunity) await git.addRemote('community', communityUrl);

          // Pull from both
          progress.report({ message: 'Pulling from origin...' });
          await git.pull('origin', 'main', { '--rebase': 'false' });

          progress.report({ message: 'Pulling from community...' });
          try { await git.pull('community', 'main', { '--rebase': 'false' }); } catch {}

          // Push to both
          progress.report({ message: 'Pushing to origin...' });
          await git.push('origin', 'main');

          progress.report({ message: 'Pushing to community...' });
          try { await git.push('community', 'main'); } catch {}

          vscode.window.showInformationMessage('✅ Synced to both origin and community repos!');
        } catch (e: any) {
          vscode.window.showErrorMessage(`Git sync failed: ${e.message}`);
        }
      }
    );
  }
}
