import * as vscode from 'vscode';

export class NotificationManager {
  showInfo(message: string): void {
    vscode.window.showInformationMessage(`Ankiniki: ${message}`);
  }

  showWarning(message: string): void {
    vscode.window.showWarningMessage(`Ankiniki: ${message}`);
  }

  showError(message: string): void {
    vscode.window.showErrorMessage(`Ankiniki: ${message}`);
  }

  async showQuickPick<T extends vscode.QuickPickItem>(
    items: T[],
    options: vscode.QuickPickOptions
  ): Promise<T | undefined> {
    return vscode.window.showQuickPick(items, options);
  }

  async showInputBox(
    options: vscode.InputBoxOptions
  ): Promise<string | undefined> {
    return vscode.window.showInputBox(options);
  }

  async showConfirmDialog(message: string): Promise<boolean> {
    const result = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Yes',
      'No'
    );
    return result === 'Yes';
  }

  showProgress<T>(
    title: string,
    task: (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken
    ) => Thenable<T>
  ): Thenable<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false,
      },
      task
    );
  }
}
