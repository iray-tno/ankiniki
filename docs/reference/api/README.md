# API Reference

This document provides comprehensive reference for the Ankiniki Backend API.

## Overview

The Ankiniki Backend API is a RESTful service built with Express.js that provides a standardized interface to AnkiConnect functionality. It serves as the communication layer between Ankiniki frontend components (Desktop, CLI, VS Code Extension) and Anki.

### Base URL

```
http://localhost:3001/api
```

### Response Format

All API responses follow this standard format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Error Handling

- **HTTP 200**: Success with `success: true`
- **HTTP 4xx**: Client errors with `success: false` and error details
- **HTTP 500**: Server errors with generic error message

## Authentication

Currently, the API does not implement authentication as it's designed for local development use. Future versions may include token-based authentication for remote access.

## Endpoints

### Health Check

#### GET `/health`

Check API server health and AnkiConnect connectivity.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "ankiConnect": "connected",
    "version": "0.1.0",
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "AnkiConnect unavailable",
  "data": {
    "status": "unhealthy",
    "ankiConnect": "disconnected"
  }
}
```

---

### Decks

#### GET `/decks`

Retrieve all available decks from Anki.

**Response:**

```json
{
  "success": true,
  "data": ["Default", "JavaScript Fundamentals", "React Concepts", "Node.js APIs"]
}
```

#### POST `/decks`

Create a new deck in Anki.

**Request Body:**

```json
{
  "name": "New Deck Name"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deckId": 1234567890,
    "name": "New Deck Name"
  },
  "message": "Deck created successfully"
}
```

#### GET `/decks/:deckName/stats`

Get statistics for a specific deck.

**Parameters:**

- `deckName`: URL-encoded deck name

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "JavaScript Fundamentals",
    "cardCount": 42,
    "newCards": 5,
    "learningCards": 8,
    "reviewCards": 29
  }
}
```

---

### Cards

#### POST `/cards`

Create a new card in Anki.

**Request Body:**

```json
{
  "deck": "JavaScript Fundamentals",
  "model": "Basic",
  "fields": {
    "Front": "What is a JavaScript closure?",
    "Back": "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned."
  },
  "tags": ["javascript", "closures", "concepts"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "noteId": 1234567890
  },
  "message": "Card created successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Deck not found: InvalidDeck"
}
```

#### GET `/cards/search`

Search for cards using Anki query syntax.

**Query Parameters:**

- `query`: Anki search query (e.g., `deck:"JavaScript" tag:functions`)
- `limit`: Maximum number of results (default: 100)

**Response:**

```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "noteId": 1234567890,
        "fields": {
          "Front": "What is a JavaScript closure?",
          "Back": "A closure is a function..."
        },
        "tags": ["javascript", "closures"],
        "deck": "JavaScript Fundamentals",
        "model": "Basic"
      }
    ],
    "totalCount": 1
  }
}
```

#### PUT `/cards/:noteId`

Update an existing card.

**Parameters:**

- `noteId`: Anki note ID

**Request Body:**

```json
{
  "fields": {
    "Front": "Updated question",
    "Back": "Updated answer"
  },
  "tags": ["updated", "javascript"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Card updated successfully"
}
```

#### DELETE `/cards/:noteId`

Delete a card from Anki.

**Parameters:**

- `noteId`: Anki note ID

**Response:**

```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

---

### Models (Note Types)

#### GET `/models`

Get all available note types/models from Anki.

**Response:**

```json
{
  "success": true,
  "data": ["Basic", "Basic (and reversed card)", "Basic (optional reversed card)", "Cloze"]
}
```

#### GET `/models/:modelName/fields`

Get field names for a specific model.

**Parameters:**

- `modelName`: URL-encoded model name

**Response:**

```json
{
  "success": true,
  "data": ["Front", "Back"]
}
```

---

### Tags

#### GET `/tags`

Get all tags used in Anki.

**Response:**

```json
{
  "success": true,
  "data": ["javascript", "react", "nodejs", "concepts", "functions", "closures"]
}
```

#### GET `/tags/:tagName/cards`

Get cards with a specific tag.

**Parameters:**

- `tagName`: URL-encoded tag name

**Query Parameters:**

- `limit`: Maximum number of results (default: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "noteId": 1234567890,
      "fields": {
        "Front": "Question with tag",
        "Back": "Answer"
      },
      "tags": ["javascript", "concepts"],
      "deck": "Programming"
    }
  ]
}
```

---

## Data Types

### Card Object

```typescript
interface Card {
  noteId: number;
  fields: Record<string, string>;
  tags: string[];
  deck: string;
  model: string;
  created?: number;
  modified?: number;
}
```

### Deck Object

```typescript
interface Deck {
  name: string;
  id?: number;
  cardCount?: number;
  newCards?: number;
  learningCards?: number;
  reviewCards?: number;
}
```

### Model Object

```typescript
interface Model {
  name: string;
  fields: string[];
  css?: string;
  cardTemplates?: CardTemplate[];
}
```

## Error Codes

### HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request format or parameters
- **404 Not Found**: Resource not found (deck, card, model)
- **422 Unprocessable Entity**: Valid request format but invalid data
- **500 Internal Server Error**: AnkiConnect error or server error
- **503 Service Unavailable**: AnkiConnect not available

### AnkiConnect Error Mapping

| AnkiConnect Error                              | HTTP Status | API Error Message                  |
| ---------------------------------------------- | ----------- | ---------------------------------- |
| "deck was not found"                           | 404         | "Deck not found: {deckName}"       |
| "model was not found"                          | 404         | "Note type not found: {modelName}" |
| "cannot create note because it is a duplicate" | 422         | "Duplicate card detected"          |
| Connection refused                             | 503         | "AnkiConnect unavailable"          |

## Rate Limiting

Currently no rate limiting is implemented. Future versions may include:

- Request rate limiting per IP
- Concurrent request limiting
- Bulk operation limits

## CORS Configuration

The API supports CORS for browser-based requests:

```javascript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

## Environment Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# AnkiConnect Configuration
ANKI_CONNECT_URL=http://localhost:8765

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
```

### Configuration File

```json
{
  "server": {
    "port": 3001,
    "host": "localhost"
  },
  "ankiConnect": {
    "url": "http://localhost:8765",
    "timeout": 5000,
    "retries": 3
  },
  "features": {
    "rateLimit": false,
    "authentication": false,
    "logging": true
  }
}
```

## SDKs and Clients

### JavaScript/TypeScript Client

```typescript
import { AnkinikiApiClient } from '@ankiniki/client';

const client = new AnkinikiApiClient('http://localhost:3001');

// Create a card
const card = await client.createCard({
  deck: 'Programming',
  model: 'Basic',
  fields: {
    Front: 'What is TypeScript?',
    Back: 'A typed superset of JavaScript',
  },
  tags: ['typescript', 'programming'],
});
```

### CLI Integration

The Ankiniki CLI tool uses this API internally:

```bash
# CLI commands map to API endpoints
ankiniki add "Question" "Answer"    # POST /api/cards
ankiniki list --decks              # GET /api/decks
ankiniki search "deck:Programming" # GET /api/cards/search
```

## API Versioning

Current version: `v1` (implicit)
Future versions will use URL versioning: `/api/v2/`

### Version Compatibility

- **v1**: Current stable API
- **v2**: Planned with authentication and enhanced features

## Development and Testing

### Running the API Server

```bash
# Development mode with hot reload
cd packages/backend
npm run dev

# Production mode
npm run build
npm start
```

### API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Create card
curl -X POST http://localhost:3001/api/cards \
  -H "Content-Type: application/json" \
  -d '{"deck":"Default","model":"Basic","fields":{"Front":"Test","Back":"Answer"}}'

# Get decks
curl http://localhost:3001/api/decks
```

### Integration Testing

```javascript
describe('API Integration Tests', () => {
  it('should create and retrieve cards', async () => {
    // Test API endpoints
    const response = await request(app)
      .post('/api/cards')
      .send({ deck: 'Test', model: 'Basic', fields: { Front: 'Q', Back: 'A' } })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

_This API reference is continuously updated. For the latest changes, check the source code and commit history._
