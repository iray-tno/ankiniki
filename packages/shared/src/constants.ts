// AnkiConnect configuration
export const ANKI_CONNECT = {
  DEFAULT_URL: 'http://localhost:8765',
  DEFAULT_TIMEOUT: 5000,
  API_VERSION: 6,
} as const;

// Anki built-in note type names
export const ANKI_MODELS = {
  BASIC: 'Basic',
  CLOZE: 'Cloze',
} as const;

// Backend Server configuration
export const SERVER = {
  DEFAULT_PORT: 3001,
  DEFAULT_URL: 'http://localhost:3001',
} as const;

// Application configuration
export const APP_CONFIG = {
  NAME: 'Ankiniki',
  VERSION: '0.1.0',
  DESCRIPTION: 'Anki companion tool for engineers',
} as const;

// Default limits and constraints
export const LIMITS = {
  MAX_CARD_CONTENT_LENGTH: 10000,
  MAX_DECK_NAME_LENGTH: 100,
  MAX_TAGS_PER_CARD: 20,
  MAX_CARDS_PER_BATCH: 100,
  DEFAULT_NEW_CARDS_PER_DAY: 20,
  DEFAULT_REVIEW_CARDS_PER_DAY: 200,
} as const;

// File extensions and types
export const SUPPORTED_FILE_TYPES = {
  MARKDOWN: ['.md', '.markdown'],
  CODE: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go'],
  DOCUMENTS: ['.pdf', '.txt'],
} as const;

// UI Constants
export const UI = {
  THEMES: ['light', 'dark', 'system'] as const,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
} as const;

// VS Code Extension
export const VSCODE = {
  EXTENSION_ID: 'ankiniki.anki-companion',
  COMMANDS: {
    ADD_CARD: 'ankiniki.addCard',
    ADD_SELECTION: 'ankiniki.addSelection',
    REVIEW_CARDS: 'ankiniki.reviewCards',
    OPEN_DECK: 'ankiniki.openDeck',
  },
  WEBVIEW_TYPE: 'ankiniki.cardManager',
} as const;

// CLI Commands
export const CLI = {
  COMMANDS: {
    ADD: 'add',
    STUDY: 'study',
    LIST: 'list',
    IMPORT: 'import',
    CONFIG: 'config',
  },
  CONFIG_FILE: '.ankiniki.json',
} as const;

// User-facing messages for AnkiConnect connectivity
export const ANKI_MESSAGES = {
  CONNECTING: 'Connecting to Anki...',
  CONNECTED: 'Connected to Anki',
  CANNOT_CONNECT: 'Cannot connect to Anki',
  CANNOT_CONNECT_HINT:
    'Cannot connect to Anki. Make sure Anki is running with AnkiConnect addon installed.',
  NOT_AVAILABLE: 'AnkiConnect is not available',
  NOT_AVAILABLE_HINT:
    'AnkiConnect is not available. Make sure Anki is running with AnkiConnect addon installed.',
  REQUEST_TIMEOUT: 'AnkiConnect request timed out',
} as const;

// Error codes
export const ERROR_CODES = {
  ANKI_CONNECT_ERROR: 'ANKI_CONNECT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
} as const;
