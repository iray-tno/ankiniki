'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateId = generateId;
exports.formatDate = formatDate;
exports.parseDate = parseDate;
exports.sanitizeCardContent = sanitizeCardContent;
exports.extractCodeFromMarkdown = extractCodeFromMarkdown;
exports.isValidDeckName = isValidDeckName;
exports.isValidCardContent = isValidCardContent;
exports.shuffleArray = shuffleArray;
exports.debounce = debounce;
exports.retry = retry;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
const types_1 = require('./types');
// ID generation
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
// Date utilities
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
function parseDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new types_1.AnkinikiError('Invalid date format', 'INVALID_DATE', 400);
  }
  return date;
}
// Card utilities
function sanitizeCardContent(content) {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: links
    .trim();
}
function extractCodeFromMarkdown(markdown) {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches = markdown.match(codeBlockRegex) || [];
  return matches.map(match =>
    match.replace(/```(\w+)?\n?/, '').replace(/```$/, '')
  );
}
// Validation helpers
function isValidDeckName(name) {
  return /^[a-zA-Z0-9\s\-_]{1,100}$/.test(name);
}
function isValidCardContent(content) {
  return content.length > 0 && content.length <= 10000;
}
// Array utilities
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
// Async retry utility
async function retry(fn, maxAttempts = 3, delay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error(
    `Failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
// Environment utilities
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}
function isProduction() {
  return process.env.NODE_ENV === 'production';
}
//# sourceMappingURL=utils.js.map
