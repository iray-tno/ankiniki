# JSON Import Guide for Ankiniki

Learn how to bulk import flashcards using JSON files for structured and flexible card creation.

## 🎯 Overview

JSON import provides a structured way to create multiple flashcards with rich metadata and flexible organization. This is perfect for:

- Importing cards with complex structure and metadata
- Creating cards from APIs or databases
- Organizing cards with detailed properties
- Migrating from systems that export JSON format

## 📋 JSON Format Options

### Format 1: Simple Array

```json
[
  {
    "front": "What is React?",
    "back": "JavaScript library for building user interfaces"
  },
  {
    "front": "What is JSX?",
    "back": "Syntax extension for JavaScript"
  }
]
```

### Format 2: Object with Metadata

```json
{
  "deck_name": "JavaScript Fundamentals",
  "default_tags": ["javascript", "programming"],
  "default_model": "Basic",
  "cards": [
    {
      "front": "What is a closure?",
      "back": "Function with access to outer scope variables",
      "tags": ["closures", "functions"],
      "difficulty": "intermediate"
    }
  ]
}
```

## 🚀 Import Methods

### 1. CLI Import

```bash
# Basic import with default deck
ankiniki import cards.json --format json --deck "JavaScript"

# Preview before importing
ankiniki import cards.json --format json --preview

# Import with default tags
ankiniki import cards.json --format json --tags "imported,json"

# Dry run for validation
ankiniki import cards.json --format json --dry-run
```

### 2. API Import

```bash
# Direct API call
curl -X POST http://localhost:3001/api/import/json \
  -F "file=@cards.json" \
  -F 'options={"defaultDeck": "Study Deck", "defaultTags": ["imported"]}'

# Preview mode
curl -X POST http://localhost:3001/api/import/json/preview \
  -F "file=@cards.json"
```

## 📊 JSON Schema Reference

### Card Object Properties

```json
{
  "front": "Question or front side", // Required
  "back": "Answer or back side", // Required
  "deck": "Target deck name", // Optional
  "model": "Anki card model", // Optional (default: Basic)
  "tags": ["tag1", "tag2"], // Optional array
  "difficulty": "beginner|intermediate|advanced", // Optional
  "metadata": {
    // Optional object
    "source": "textbook",
    "chapter": "5"
  }
}
```

### Import Options

```json
{
  "defaultDeck": "Default Deck", // Fallback deck name
  "defaultModel": "Basic", // Fallback model type
  "defaultTags": ["imported"], // Tags added to all cards
  "dryRun": false, // Preview mode
  "validate": true // Enable validation
}
```

## 📝 Detailed Examples

### Example 1: Programming Concepts

```json
[
  {
    "front": "What is Big O notation?",
    "back": "Describes the upper bound of algorithm complexity",
    "deck": "Computer Science",
    "tags": ["algorithms", "complexity"],
    "difficulty": "intermediate"
  },
  {
    "front": "What is recursion?",
    "back": "Programming technique where function calls itself",
    "deck": "Programming Concepts",
    "tags": ["recursion", "functions"],
    "difficulty": "beginner"
  }
]
```

**CLI Command:**

```bash
ankiniki import programming.json --format json --preview
```

### Example 2: Language Learning with Metadata

```json
{
  "deck_name": "Spanish Vocabulary",
  "default_tags": ["spanish", "vocabulary"],
  "default_model": "Basic",
  "cards": [
    {
      "front": "¿Cómo estás?",
      "back": "How are you?",
      "tags": ["greetings", "common"],
      "difficulty": "beginner",
      "metadata": {
        "lesson": 1,
        "frequency": "high"
      }
    },
    {
      "front": "Me gusta mucho",
      "back": "I like it a lot",
      "tags": ["expressions", "preferences"],
      "difficulty": "beginner"
    }
  ]
}
```

### Example 3: Code Examples

````json
[
  {
    "front": "What does this JavaScript code do?\n\n```javascript\nconst factorial = n => n <= 1 ? 1 : n * factorial(n-1);\n```",
    "back": "Calculates factorial using recursive arrow function",
    "deck": "JavaScript Examples",
    "tags": ["javascript", "recursion", "functions"],
    "difficulty": "intermediate"
  },
  {
    "front": "Explain this React hook:\n\n```jsx\nconst [count, setCount] = useState(0);\n```",
    "back": "Declares state variable 'count' with initial value 0 and setter function 'setCount'",
    "deck": "React Hooks",
    "tags": ["react", "hooks", "state"],
    "difficulty": "beginner"
  }
]
````

## ⚙️ Advanced Features

### Global Defaults vs Card-Specific Values

```json
{
  "deck_name": "Global Deck", // Applied to all cards
  "default_tags": ["global", "imported"], // Added to all cards
  "default_model": "Basic", // Used if card doesn't specify
  "cards": [
    {
      "front": "Question 1",
      "back": "Answer 1"
      // Uses global deck, tags, and model
    },
    {
      "front": "Question 2",
      "back": "Answer 2",
      "deck": "Specific Deck", // Overrides global deck
      "tags": ["specific"], // Replaces global tags
      "model": "Cloze" // Overrides global model
    }
  ]
}
```

### Tag Merging

```json
{
  "default_tags": ["global", "imported"],
  "cards": [
    {
      "front": "Question",
      "back": "Answer",
      "tags": ["specific", "custom"]
      // Final tags: ["global", "imported", "specific", "custom"]
    }
  ]
}
```

## 🎯 CLI Usage Examples

### Basic Import Commands

```bash
# Import simple JSON array
ankiniki import simple.json --format json --deck "Study Cards"

# Import with preview
ankiniki import cards.json --format json --preview

# Import with default tags
ankiniki import cards.json --format json --tags "review,important"

# Dry run validation
ankiniki import cards.json --format json --dry-run
```

### Advanced Import Options

```bash
# Specify model type
ankiniki import cards.json --format json --model "Cloze" --deck "Cloze Cards"

# Multiple default tags
ankiniki import cards.json --format json --tags "imported,json,batch-1"

# Preview with specific deck
ankiniki import cards.json --format json --preview --deck "Preview Deck"
```

## 🔧 Validation and Error Handling

### Common Validation Errors

**Missing required fields:**

```json
{
  "front": "Question"
  // Missing "back" field - will cause error
}
```

**Invalid JSON structure:**

```json
{
  "cards": "not an array" // Should be array of card objects
}
```

**Missing cards property:**

```json
{
  "deck_name": "Test"
  // Missing "cards" property when using object format
}
```

### Error Prevention

```bash
# Always preview first
ankiniki import cards.json --format json --preview

# Validate JSON syntax
cat cards.json | jq '.' # Check if valid JSON

# Check specific card count
jq 'length' simple-array.json
jq '.cards | length' object-format.json
```

## 📈 Performance Tips

### For Large Files

- **Keep under 5MB**: File size limit for uploads
- **Use arrays**: Simple array format is faster to process
- **Validate first**: Always use `--preview` for large files
- **Batch imports**: Split very large datasets

### Optimization Examples

```bash
# Good: Preview large file first
ankiniki import large-cards.json --format json --preview
ankiniki import large-cards.json --format json

# Better: Split large files
jq '.[0:500]' large.json > batch1.json
jq '.[500:1000]' large.json > batch2.json
```

## 🐛 Troubleshooting

### Common Issues

**1. Invalid JSON format**

```bash
# Solution: Validate JSON syntax
cat cards.json | jq '.'
```

**2. Cards not importing**

```bash
# Solution: Check deck exists and format is correct
ankiniki import cards.json --format json --preview
```

**3. Tags not applying correctly**

```bash
# Solution: Check tag format (array vs string)
# Correct: "tags": ["tag1", "tag2"]
# Wrong: "tags": "tag1,tag2"
```

**4. Model validation errors**

```bash
# Solution: Use existing Anki models
ankiniki import cards.json --format json --model "Basic"
```

### Debug Commands

```bash
# Check file content
head -20 cards.json

# Validate JSON structure
jq '.cards[0]' cards.json  # Check first card

# Count cards
jq 'length' array-format.json
jq '.cards | length' object-format.json

# Test import with single card
echo '[{"front":"Test","back":"Answer"}]' > test.json
ankiniki import test.json --format json --preview
```

## 📋 Format Comparison

| Feature         | Simple Array       | Object Format         |
| --------------- | ------------------ | --------------------- |
| Structure       | `[{card}, {card}]` | `{"cards": [{card}]}` |
| Global defaults | ❌                 | ✅                    |
| Metadata        | Card-level only    | Global + Card-level   |
| File size       | Smaller            | Larger                |
| Flexibility     | Basic              | Advanced              |
| Best for        | Simple imports     | Complex datasets      |

## 💡 Best Practices

### 1. Structure Organization

**✅ Good practices:**

- Use consistent property names
- Include all required fields (front, back)
- Use arrays for tags: `["tag1", "tag2"]`
- Validate JSON syntax before import
- Test with small files first

**❌ Avoid:**

- Mixing string and array formats for tags
- Very large files (>5MB)
- Special characters in deck names
- Missing required properties

### 2. Content Guidelines

**Code in JSON:**

````json
{
  "front": "What does this code do?\n\n```javascript\nconst add = (a, b) => a + b;\n```",
  "back": "Arrow function that adds two numbers"
}
````

**Escaping quotes:**

```json
{
  "front": "What does \"hoisting\" mean?",
  "back": "JavaScript's behavior of moving declarations to the top"
}
```

### 3. Import Workflow

```bash
# 1. Validate JSON
cat cards.json | jq '.'

# 2. Preview import
ankiniki import cards.json --format json --preview

# 3. Import with specific options
ankiniki import cards.json --format json --deck "Target Deck"

# 4. Verify in Anki
# Check Anki for imported cards
```

## 🎉 Success Examples

### Migration from Database

```sql
-- Export from database to JSON
SELECT json_arrayagg(
  json_object(
    'front', question,
    'back', answer,
    'deck', category,
    'tags', json_array(tag1, tag2),
    'difficulty', level
  )
) FROM flashcards;
```

### API Integration

```bash
# Fetch cards from API and import
curl https://api.example.com/cards | jq '.' > api-cards.json
ankiniki import api-cards.json --format json --deck "API Import"
```

---

## Summary

JSON import in Ankiniki provides:

- **Structured data** with rich metadata support
- **Two flexible formats** (array and object)
- **Advanced features** like global defaults and tag merging
- **CLI and API** access methods
- **Comprehensive validation** with detailed error reporting

Perfect for complex card imports, API integrations, and maintaining structured flashcard datasets! 🚀
