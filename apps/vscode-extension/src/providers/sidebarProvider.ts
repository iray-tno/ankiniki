import * as vscode from 'vscode';
import { CardCreationService } from '../services/cardCreation';
import { AnkiConnectClient } from '../services/ankiConnect';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ankinikiSidebar';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly cardService: CardCreationService,
    private readonly ankiClient: AnkiConnectClient
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
        case 'generateFromFile':
          vscode.commands.executeCommand('ankiniki.generateFromFile');
          break;
        case 'openSettings':
          vscode.commands.executeCommand('ankiniki.openSettings');
          break;
      }
    });

    // Check AnkiConnect status and push it to the webview
    this.ankiClient.ping().then(connected => {
      this._view?.webview.postMessage({ type: 'status', connected });
    });
  }

  public refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ankiniki</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
    .header { margin-bottom: 16px; text-align: center; }
    .header h2 { margin: 0 0 4px 0; color: var(--vscode-titleBar-activeForeground); }
    .header p { margin: 0; color: var(--vscode-descriptionForeground); font-size: 12px; }
    .conn-status { margin-bottom: 14px; padding: 6px 10px; border-radius: 3px; font-size: 12px; border-left: 3px solid; }
    .conn-checking { background: var(--vscode-inputValidation-infoBackground); border-color: var(--vscode-inputValidation-infoBorder); }
    .conn-ok  { background: var(--vscode-inputValidation-infoBackground); border-color: var(--vscode-testing-iconPassed, #73c991); }
    .conn-err { background: var(--vscode-inputValidation-errorBackground); border-color: var(--vscode-inputValidation-errorBorder); }
    h3 { margin: 0 0 10px 0; font-size: 13px; color: var(--vscode-titleBar-activeForeground); }
    .action-button { display: block; width: 100%; padding: 7px 10px; margin-bottom: 7px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 13px; text-align: left; }
    .action-button:hover { background: var(--vscode-button-hoverBackground); }
    .generate-button { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); margin-top: 4px; }
    .generate-button:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .settings-section { border-top: 1px solid var(--vscode-panel-border); padding-top: 12px; margin-top: 12px; }
    .settings-button { background: transparent; color: var(--vscode-descriptionForeground); border: 1px solid var(--vscode-panel-border); }
    .settings-button:hover { background: var(--vscode-list-hoverBackground); }
    .tip { margin-top: 14px; padding: 6px 10px; background: var(--vscode-textBlockQuote-background); border-left: 3px solid var(--vscode-textBlockQuote-border); font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>📚 Ankiniki</h2>
    <p>Create Anki flashcards from VS Code</p>
  </div>

  <div id="conn" class="conn-status conn-checking">⏳ Checking Anki connection…</div>

  <div class="quick-actions">
    <h3>Quick Actions</h3>
    <button class="action-button" onclick="addSelected()">📝&nbsp; Add Selected Text</button>
    <button class="action-button" onclick="addCode()">💻&nbsp; Add Code Block</button>
    <button class="action-button" onclick="quickAdd()">⚡&nbsp; Quick Add Card</button>
    <button class="action-button generate-button" onclick="generateFromFile()">🤖&nbsp; Generate from Current File (AI)</button>
  </div>

  <div class="settings-section">
    <button class="action-button settings-button" onclick="openSettings()">⚙️&nbsp; Settings</button>
  </div>

  <div class="tip">
    💡 Select text → <kbd>Ctrl+Shift+A</kbd> to create a flashcard instantly
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function quickAdd()        { vscode.postMessage({ type: 'quickAdd' }); }
    function addSelected()     { vscode.postMessage({ type: 'addSelected' }); }
    function addCode()         { vscode.postMessage({ type: 'addCode' }); }
    function generateFromFile(){ vscode.postMessage({ type: 'generateFromFile' }); }
    function openSettings()    { vscode.postMessage({ type: 'openSettings' }); }

    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === 'status') {
        const el = document.getElementById('conn');
        if (el) {
          if (msg.connected) {
            el.className = 'conn-status conn-ok';
            el.textContent = '✓ Connected to Anki';
          } else {
            el.className = 'conn-status conn-err';
            el.textContent = '✗ Cannot reach Anki — open Anki with AnkiConnect installed';
          }
        }
      }
    });
  </script>
</body>
</html>`;
  }
}
