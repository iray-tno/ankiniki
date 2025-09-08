'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ERROR_CODES =
  exports.CLI =
  exports.VSCODE =
  exports.UI =
  exports.SUPPORTED_FILE_TYPES =
  exports.LIMITS =
  exports.APP_CONFIG =
  exports.ANKI_CONNECT =
    void 0;
// AnkiConnect configuration
exports.ANKI_CONNECT = {
  DEFAULT_URL: 'http://localhost:8765',
  DEFAULT_TIMEOUT: 5000,
  API_VERSION: 6,
};
// Application configuration
exports.APP_CONFIG = {
  NAME: 'Ankiniki',
  VERSION: '0.1.0',
  DESCRIPTION: 'Anki companion tool for engineers',
};
// Default limits and constraints
exports.LIMITS = {
  MAX_CARD_CONTENT_LENGTH: 10000,
  MAX_DECK_NAME_LENGTH: 100,
  MAX_TAGS_PER_CARD: 20,
  MAX_CARDS_PER_BATCH: 100,
  DEFAULT_NEW_CARDS_PER_DAY: 20,
  DEFAULT_REVIEW_CARDS_PER_DAY: 200,
};
// File extensions and types
exports.SUPPORTED_FILE_TYPES = {
  MARKDOWN: ['.md', '.markdown'],
  CODE: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go'],
  DOCUMENTS: ['.pdf', '.txt'],
};
// UI Constants
exports.UI = {
  THEMES: ['light', 'dark', 'system'],
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
};
// VS Code Extension
exports.VSCODE = {
  EXTENSION_ID: 'ankiniki.anki-companion',
  COMMANDS: {
    ADD_CARD: 'ankiniki.addCard',
    ADD_SELECTION: 'ankiniki.addSelection',
    REVIEW_CARDS: 'ankiniki.reviewCards',
    OPEN_DECK: 'ankiniki.openDeck',
  },
  WEBVIEW_TYPE: 'ankiniki.cardManager',
};
// CLI Commands
exports.CLI = {
  COMMANDS: {
    ADD: 'add',
    STUDY: 'study',
    LIST: 'list',
    IMPORT: 'import',
    CONFIG: 'config',
  },
  CONFIG_FILE: '.ankiniki.json',
};
// Error codes
exports.ERROR_CODES = {
  ANKI_CONNECT_ERROR: 'ANKI_CONNECT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
};
//# sourceMappingURL=constants.js.map
