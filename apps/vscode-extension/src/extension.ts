import * as vscode from 'vscode';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiConnectClient } from './services/ankiConnect';
import { ConfigurationManager } from './services/configuration';
import { NotificationManager } from './services/notifications';
import { CardCreationService } from './services/cardCreation';
import { SidebarProvider } from './providers/sidebarProvider';

let ankiClient: AnkiConnectClient;
let configManager: ConfigurationManager;
let notificationManager: NotificationManager;
let cardService: CardCreationService;
let sidebarProvider: SidebarProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating Ankiniki VS Code extension...');

  // Initialize services
  configManager = new ConfigurationManager();
  notificationManager = new NotificationManager();
  ankiClient = new AnkiConnectClient(configManager);
  cardService = new CardCreationService(
    ankiClient,
    configManager,
    notificationManager
  );
  sidebarProvider = new SidebarProvider(context.extensionUri, cardService);

  // Set context for conditional UI elements
  vscode.commands.executeCommand('setContext', 'ankiniki.enabled', true);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ankiniki.addSelectedText', () => {
      handleAddSelectedText();
    }),

    vscode.commands.registerCommand('ankiniki.addCodeBlock', () => {
      handleAddCodeBlock();
    }),

    vscode.commands.registerCommand('ankiniki.quickAdd', () => {
      handleQuickAdd();
    }),

    vscode.commands.registerCommand('ankiniki.openSidebar', () => {
      vscode.commands.executeCommand('workbench.view.extension.ankiniki');
    }),

    vscode.commands.registerCommand('ankiniki.openSettings', () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'ankiniki'
      );
    }),

    vscode.commands.registerCommand('ankiniki.refresh', () => {
      sidebarProvider.refresh();
    })
  );

  // Register sidebar provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'ankinikiSidebar',
      sidebarProvider
    )
  );

  // Register status bar
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'ankiniki.openSidebar';
  statusBarItem.text = '$(book) Ankiniki';
  statusBarItem.tooltip = 'Open Ankiniki Sidebar';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Test connection on startup
  testAnkiConnection();

  console.log('Ankiniki VS Code extension activated!');
}

async function handleAddSelectedText() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    notificationManager.showError('No active editor found');
    return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
    notificationManager.showError('No text selected');
    return;
  }

  const selectedText = editor.document.getText(selection);
  const language = editor.document.languageId;
  const filePath = vscode.workspace.asRelativePath(editor.document.fileName);

  await cardService.createCardFromSelection(selectedText, language, filePath);
}

async function handleAddCodeBlock() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    notificationManager.showError('No active editor found');
    return;
  }

  // If there's a selection, use it; otherwise, use the current line
  let codeText: string;
  let range: vscode.Range;

  if (!editor.selection.isEmpty) {
    codeText = editor.document.getText(editor.selection);
    range = editor.selection;
  } else {
    const line = editor.selection.active.line;
    range = editor.document.lineAt(line).range;
    codeText = editor.document.lineAt(line).text;
  }

  const language = editor.document.languageId;
  const filePath = vscode.workspace.asRelativePath(editor.document.fileName);

  await cardService.createCardFromCode(codeText, language, filePath, range);
}

async function handleQuickAdd() {
  const front = await vscode.window.showInputBox({
    prompt: 'Enter the question/front side of the card',
    placeHolder: 'What is a React component?',
  });

  if (!front) {
    return;
  }

  const back = await vscode.window.showInputBox({
    prompt: 'Enter the answer/back side of the card',
    placeHolder: 'A reusable piece of UI...',
  });

  if (!back) {
    return;
  }

  await cardService.createQuickCard(front, back);
}

async function testAnkiConnection() {
  try {
    const isConnected = await ankiClient.ping();
    if (isConnected) {
      notificationManager.showInfo(`✅ ${ANKI_MESSAGES.CONNECTED}`);
    } else {
      notificationManager.showWarning(
        `⚠️ ${ANKI_MESSAGES.CANNOT_CONNECT_HINT}`
      );
    }
  } catch (error) {
    console.error('Failed to test Anki connection:', error);
    notificationManager.showWarning(`⚠️ ${ANKI_MESSAGES.CANNOT_CONNECT_HINT}`);
  }
}

export function deactivate() {
  console.log('Deactivating Ankiniki VS Code extension...');
}
