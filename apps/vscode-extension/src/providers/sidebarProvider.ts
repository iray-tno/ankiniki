import * as vscode from 'vscode';
import { CardCreationService } from '../services/cardCreation';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ankinikiSidebar';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly cardService: CardCreationService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async data => {
      switch (data.type) {
        case 'quickAdd':
          vscode.commands.executeCommand('ankiniki.quickAdd');
          break;
        case 'addSelected':
          vscode.commands.executeCommand('ankiniki.addSelectedText');
          break;
        case 'addCode':
          vscode.commands.executeCommand('ankiniki.addCodeBlock');
          break;
        case 'openSettings':
          vscode.commands.executeCommand('ankiniki.openSettings');
          break;
      }
    });
  }

  public refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Ankiniki</title>
				<style>
					body {
						font-family: var(--vscode-font-family);
						color: var(--vscode-foreground);
						background-color: var(--vscode-editor-background);
						padding: 16px;
					}
					
					.header {
						margin-bottom: 20px;
						text-align: center;
					}
					
					.header h2 {
						margin: 0 0 8px 0;
						color: var(--vscode-titleBar-activeForeground);
					}
					
					.header p {
						margin: 0;
						color: var(--vscode-descriptionForeground);
						font-size: 12px;
					}
					
					.quick-actions {
						margin-bottom: 24px;
					}
					
					.quick-actions h3 {
						margin: 0 0 12px 0;
						font-size: 14px;
						color: var(--vscode-titleBar-activeForeground);
					}
					
					.action-button {
						display: block;
						width: 100%;
						padding: 8px 12px;
						margin-bottom: 8px;
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						border-radius: 3px;
						cursor: pointer;
						font-size: 13px;
						text-align: left;
					}
					
					.action-button:hover {
						background-color: var(--vscode-button-hoverBackground);
					}
					
					.action-button:last-child {
						margin-bottom: 0;
					}
					
					.settings-section {
						border-top: 1px solid var(--vscode-panel-border);
						padding-top: 16px;
					}
					
					.settings-button {
						background-color: var(--vscode-button-secondaryBackground);
						color: var(--vscode-button-secondaryForeground);
					}
					
					.settings-button:hover {
						background-color: var(--vscode-button-secondaryHoverBackground);
					}
					
					.icon {
						margin-right: 8px;
					}
					
					.status {
						margin-top: 16px;
						padding: 8px 12px;
						background-color: var(--vscode-inputValidation-infoBackground);
						border-left: 3px solid var(--vscode-inputValidation-infoBorder);
						border-radius: 3px;
						font-size: 12px;
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h2>📚 Ankiniki</h2>
					<p>Create Anki flashcards from VS Code</p>
				</div>
				
				<div class="quick-actions">
					<h3>Quick Actions</h3>
					
					<button class="action-button" onclick="addSelected()">
						<span class="icon">📝</span>
						Add Selected Text
					</button>
					
					<button class="action-button" onclick="addCode()">
						<span class="icon">💻</span>
						Add Code Block
					</button>
					
					<button class="action-button" onclick="quickAdd()">
						<span class="icon">⚡</span>
						Quick Add Card
					</button>
				</div>
				
				<div class="settings-section">
					<button class="action-button settings-button" onclick="openSettings()">
						<span class="icon">⚙️</span>
						Settings
					</button>
				</div>
				
				<div class="status">
					💡 <strong>Tip:</strong> Select text and use <kbd>Ctrl+Shift+A</kbd> to quickly create a flashcard
				</div>

				<script>
					const vscode = acquireVsCodeApi();

					function quickAdd() {
						vscode.postMessage({ type: 'quickAdd' });
					}

					function addSelected() {
						vscode.postMessage({ type: 'addSelected' });
					}

					function addCode() {
						vscode.postMessage({ type: 'addCode' });
					}

					function openSettings() {
						vscode.postMessage({ type: 'openSettings' });
					}
				</script>
			</body>
			</html>`;
  }
}
