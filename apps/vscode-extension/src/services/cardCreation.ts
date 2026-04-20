import * as vscode from 'vscode';
import { ANKI_MODELS } from '@ankiniki/shared';
import { AnkiConnectClient } from './ankiConnect';
import { ConfigurationManager } from './configuration';
import { NotificationManager } from './notifications';

export interface CardCreationOptions {
  deck?: string;
  model?: string;
  tags?: string[];
  includeMetadata?: boolean;
}

export class CardCreationService {
  constructor(
    private ankiClient: AnkiConnectClient,
    private config: ConfigurationManager,
    private notifications: NotificationManager
  ) {}

  async createCardFromSelection(
    selectedText: string,
    language: string,
    filePath: string,
    options: CardCreationOptions = {}
  ): Promise<void> {
    try {
      // Get available decks for selection
      const availableDecks = await this.ankiClient.getDeckNames();
      const defaultDeck = options.deck || this.config.getDefaultDeck();

      // Show deck selection if default not available
      let targetDeck = defaultDeck;
      if (!availableDecks.includes(defaultDeck)) {
        const selectedDeck = await this.notifications.showQuickPick(
          availableDecks.map(deck => ({ label: deck, description: deck })),
          { placeHolder: 'Select target deck' }
        );
        if (!selectedDeck) {
          return;
        }
        targetDeck = selectedDeck.label;
      }

      // Prompt for question/context
      const question = await this.notifications.showInputBox({
        prompt: 'Enter the question or context for this selection',
        placeHolder: 'What does this code do?',
        value: this.generateDefaultQuestion(selectedText, language),
      });

      if (!question) {
        return;
      }

      // Create card content
      const front = this.formatFront(question, filePath);
      const back = this.formatBack(selectedText, language, filePath);
      const tags = this.generateTags(language, filePath, options.tags);

      await this.createCard(targetDeck, front, back, tags);

      if (this.config.getShowNotifications()) {
        this.notifications.showInfo(`Card created in deck "${targetDeck}"`);
      }
    } catch (error) {
      this.notifications.showError(
        `Failed to create card: ${(error as Error).message}`
      );
    }
  }

  async createCardFromCode(
    codeText: string,
    language: string,
    filePath: string,
    range: vscode.Range,
    options: CardCreationOptions = {}
  ): Promise<void> {
    try {
      const availableDecks = await this.ankiClient.getDeckNames();
      const defaultDeck = options.deck || this.config.getDefaultDeck();

      let targetDeck = defaultDeck;
      if (!availableDecks.includes(defaultDeck)) {
        const selectedDeck = await this.notifications.showQuickPick(
          availableDecks.map(deck => ({ label: deck, description: deck })),
          { placeHolder: 'Select target deck' }
        );
        if (!selectedDeck) {
          return;
        }
        targetDeck = selectedDeck.label;
      }

      const question = await this.notifications.showInputBox({
        prompt: 'Enter the question for this code block',
        placeHolder: 'What does this function do?',
        value: this.generateCodeQuestion(codeText, language),
      });

      if (!question) {
        return;
      }

      const front = this.formatFront(question, filePath);
      const back = this.formatCodeBlock(codeText, language, filePath, range);
      const tags = this.generateTags(language, filePath, options.tags);

      await this.createCard(targetDeck, front, back, tags);

      if (this.config.getShowNotifications()) {
        this.notifications.showInfo(
          `Code card created in deck "${targetDeck}"`
        );
      }
    } catch (error) {
      this.notifications.showError(
        `Failed to create code card: ${(error as Error).message}`
      );
    }
  }

  async createQuickCard(
    front: string,
    back: string,
    options: CardCreationOptions = {}
  ): Promise<void> {
    try {
      const availableDecks = await this.ankiClient.getDeckNames();
      const defaultDeck = options.deck || this.config.getDefaultDeck();

      let targetDeck = defaultDeck;
      if (!availableDecks.includes(defaultDeck)) {
        const selectedDeck = await this.notifications.showQuickPick(
          availableDecks.map(deck => ({ label: deck, description: deck })),
          { placeHolder: 'Select target deck' }
        );
        if (!selectedDeck) {
          return;
        }
        targetDeck = selectedDeck.label;
      }

      const tags = options.tags || ['vscode', 'quick-add'];

      await this.createCard(targetDeck, front, back, tags);

      if (this.config.getShowNotifications()) {
        this.notifications.showInfo(
          `Quick card created in deck "${targetDeck}"`
        );
      }
    } catch (error) {
      this.notifications.showError(
        `Failed to create quick card: ${(error as Error).message}`
      );
    }
  }

  async generateCardsFromFile(
    content: string,
    language: string,
    filePath: string
  ): Promise<void> {
    const serverUrl = this.config.getServerUrl();
    const defaultDeck = this.config.getDefaultDeck();

    // Map VS Code language IDs to content types
    const codeLanguages = new Set([
      'javascript',
      'typescript',
      'javascriptreact',
      'typescriptreact',
      'python',
      'java',
      'cpp',
      'c',
      'go',
      'rust',
      'ruby',
      'php',
      'swift',
      'kotlin',
      'scala',
      'csharp',
    ]);
    const contentType =
      language === 'markdown'
        ? 'markdown'
        : codeLanguages.has(language)
          ? 'code'
          : 'text';

    interface GeneratedCard {
      front: string;
      back: string;
      tags: string[];
      difficulty: string;
      confidence_score: number;
    }

    try {
      // Step 1 — generate cards via backend ML service
      const generated = await this.notifications.showProgress(
        'Ankiniki: Generating cards with AI…',
        async () => {
          const response = await fetch(`${serverUrl}/api/ml/generate/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              content_type: contentType,
              difficulty_level: 'intermediate',
              max_cards: 10,
              ...(codeLanguages.has(language)
                ? { programming_language: language }
                : {}),
            }),
          });

          if (!response.ok) {
            const err = (await response.json().catch(() => ({}))) as {
              detail?: string;
            };
            throw new Error(err.detail ?? `HTTP ${response.status}`);
          }

          const body = (await response.json()) as {
            success: boolean;
            data: { success: boolean; cards: GeneratedCard[] };
            detail?: string;
          };

          if (!body.success) {
            throw new Error(body.detail ?? 'Generation failed');
          }

          return body.data?.cards ?? [];
        }
      );

      if (!generated.length) {
        this.notifications.showWarning(
          'No cards were generated for this file.'
        );
        return;
      }

      // Step 2 — let user pick which cards to keep
      const picks = generated.map((card, i) => ({
        label: `$(lightbulb) ${card.front.slice(0, 80)}${card.front.length > 80 ? '…' : ''}`,
        description: `${Math.round(card.confidence_score * 100)}% confidence · ${card.difficulty}`,
        detail: card.back.slice(0, 120),
        picked: card.confidence_score >= 0.6,
        card,
        index: i,
      }));

      const selected = await vscode.window.showQuickPick(picks, {
        canPickMany: true,
        placeHolder: `Select cards to add to Anki (${generated.length} generated from ${filePath})`,
        title: 'AI-Generated Flashcards',
      });

      if (!selected || selected.length === 0) {
        return;
      }

      // Step 3 — ensure deck and add selected cards
      const availableDecks = await this.ankiClient.getDeckNames();
      let targetDeck = defaultDeck;
      if (!availableDecks.includes(defaultDeck)) {
        const pick = await this.notifications.showQuickPick(
          availableDecks.map(d => ({ label: d, description: d })),
          { placeHolder: 'Select target deck' }
        );
        if (!pick) {
          return;
        }
        targetDeck = pick.label;
      }

      let added = 0;
      let failed = 0;
      for (const item of selected) {
        try {
          const allTags = [
            ...item.card.tags,
            'ai-generated',
            `difficulty-${item.card.difficulty}`,
            'vscode',
          ];
          if (codeLanguages.has(language)) {
            allTags.push(language);
          }
          await this.ankiClient.addNote(
            targetDeck,
            ANKI_MODELS.BASIC,
            { Front: item.card.front, Back: item.card.back },
            allTags
          );
          added++;
        } catch {
          failed++;
        }
      }

      const msg = `Added ${added} AI-generated card(s) to "${targetDeck}"${failed > 0 ? ` (${failed} failed)` : ''}`;
      if (failed > 0) {
        this.notifications.showWarning(msg);
      } else {
        this.notifications.showInfo(msg);
      }
    } catch (error) {
      this.notifications.showError(
        `Failed to generate cards: ${(error as Error).message}`
      );
    }
  }

  private async createCard(
    deck: string,
    front: string,
    back: string,
    tags: string[]
  ): Promise<void> {
    const model = this.config.getDefaultModel();

    // Get field names for the model
    const fieldNames = await this.ankiClient.modelFieldNames(model);

    // Map to AnkiConnect fields format
    const fields: Record<string, string> = {};
    if (fieldNames.length >= 2) {
      fields[fieldNames[0]] = front;
      fields[fieldNames[1]] = back;
    } else {
      // Fallback for unknown models
      fields['Front'] = front;
      fields['Back'] = back;
    }

    await this.ankiClient.addNote(deck, model, fields, tags);
  }

  private generateDefaultQuestion(text: string, language: string): string {
    const preview = text.slice(0, 50) + (text.length > 50 ? '...' : '');

    if (language === 'javascript' || language === 'typescript') {
      if (text.includes('function') || text.includes('=>')) {
        return `What does this ${language} function do?`;
      }
      if (text.includes('class ')) {
        return `What is the purpose of this ${language} class?`;
      }
    }

    return `Explain this ${language} code: ${preview}`;
  }

  private generateCodeQuestion(code: string, language: string): string {
    if (code.includes('function') || code.includes('=>')) {
      return `What does this ${language} function do?`;
    }
    if (code.includes('class ')) {
      return `What is the purpose of this ${language} class?`;
    }
    if (code.includes('interface') || code.includes('type ')) {
      return `What does this ${language} type definition represent?`;
    }

    return `Explain this ${language} code`;
  }

  private formatFront(question: string, filePath?: string): string {
    let front = question;

    if (this.config.getIncludeFilePath() && filePath) {
      front += `\n\n<small>From: <code>${filePath}</code></small>`;
    }

    return front;
  }

  private formatBack(
    content: string,
    language: string,
    filePath?: string
  ): string {
    let back = '';

    if (this.config.getAutoDetectLanguage() && language) {
      back += `<pre><code class="${language}">${this.escapeHtml(content)}</code></pre>`;
    } else {
      back += `<pre><code>${this.escapeHtml(content)}</code></pre>`;
    }

    if (this.config.getIncludeFilePath() && filePath) {
      back += `\n\n<small>Source: <code>${filePath}</code></small>`;
    }

    return back;
  }

  private formatCodeBlock(
    code: string,
    language: string,
    filePath?: string,
    range?: vscode.Range
  ): string {
    let back = '';

    if (this.config.getAutoDetectLanguage() && language) {
      back += `<pre><code class="${language}">${this.escapeHtml(code)}</code></pre>`;
    } else {
      back += `<pre><code>${this.escapeHtml(code)}</code></pre>`;
    }

    if (this.config.getIncludeFilePath() && filePath) {
      let location = `Source: <code>${filePath}</code>`;
      if (range) {
        location += ` (lines ${range.start.line + 1}-${range.end.line + 1})`;
      }
      back += `\n\n<small>${location}</small>`;
    }

    return back;
  }

  private generateTags(
    language: string,
    filePath?: string,
    customTags?: string[]
  ): string[] {
    const tags = ['vscode'];

    if (language) {
      tags.push(language);
    }

    if (filePath) {
      const extension = filePath.split('.').pop();
      if (extension && extension !== language) {
        tags.push(extension);
      }

      // Add project/folder tags
      const pathParts = filePath.split('/');
      if (pathParts.length > 1) {
        tags.push(pathParts[0]); // First folder as project tag
      }
    }

    if (customTags) {
      tags.push(...customTags);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
