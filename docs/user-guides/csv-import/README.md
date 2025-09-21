# CSV Import Guide for Ankiniki

Learn how to bulk import flashcards using CSV files for efficient card creation.

## 🎯 Overview

CSV import allows you to create multiple flashcards at once from a spreadsheet or CSV file. This is perfect for:

- Bulk importing existing study materials
- Creating cards from shared spreadsheets
- Migrating from other flashcard systems
- Preparing study materials in advance

## 📋 Basic CSV Format

### Minimal Format

```csv
Front,Back
"What is React?","JavaScript library for building user interfaces"
"What is Node.js?","JavaScript runtime built on Chrome's V8 engine"
"What is npm?","Node Package Manager for JavaScript"
```

### Complete Format

```csv
Front,Back,Deck,Tags,Model,Difficulty
"What is const?","Block-scoped variable declaration","JavaScript","javascript,variables","Basic","beginner"
"What is let vs var?","let is block-scoped, var is function-scoped","JavaScript","javascript,scope","Basic","beginner"
```

## 🚀 Import Methods

### 1. CLI Import

```bash
# Basic import with default deck
ankiniki import cards.csv --deck "JavaScript Fundamentals"

# Preview before importing
ankiniki import cards.csv --preview

# Custom delimiter and tags
ankiniki import cards.csv --delimiter ";" --tags "imported,csv"

# Custom column mapping
ankiniki import cards.csv --mapping '{"front": "Question", "back": "Answer", "deck": "Subject"}'
```

### 2. API Import

```bash
# Direct API call
curl -X POST http://localhost:3001/api/import/csv \
  -F "file=@cards.csv" \
  -F 'options={"defaultDeck": "JavaScript", "defaultTags": ["imported"]}'

# Preview mode
curl -X POST http://localhost:3001/api/import/csv/preview \
  -F "file=@cards.csv"
```

## 📊 CSV Format Examples

### Example 1: JavaScript Fundamentals

````csv
Front,Back,Deck,Tags,Difficulty
"What is const in JavaScript?","Block-scoped variable declaration that cannot be reassigned","JavaScript Fundamentals","javascript,variables,es6","beginner"
"What does this arrow function do?
```javascript
const add = (a, b) => a + b;
```","Returns the sum of two parameters using ES6 arrow function syntax","JavaScript Fundamentals","javascript,functions,es6","beginner"
````

### Example 2: React Hooks (Custom Columns)

```csv
Question,Answer,Subject,Topics,Level
"What is useState?","React Hook for adding state to functional components","React Hooks","react,hooks,state","beginner"
"What is useEffect?","React Hook for performing side effects","React Hooks","react,hooks,lifecycle","beginner"
```

**CLI Command for Custom Columns:**

```bash
ankiniki import react-hooks.csv \
  --mapping '{"front": "Question", "back": "Answer", "deck": "Subject", "tags": "Topics", "difficulty": "Level"}'
```

### Example 3: Minimal Format

```csv
Front,Back
"What is Docker?","Platform for developing applications in containers"
"What is Kubernetes?","Container orchestration platform"
```

**CLI Command:**

```bash
ankiniki import minimal.csv --deck "DevOps" --tags "containers,devops"
```

## ⚙️ Advanced Options

### Column Mapping

Customize which CSV columns map to card fields:

```json
{
  "front": "Question", // CSV column for front of card
  "back": "Answer", // CSV column for back of card
  "deck": "Subject", // CSV column for deck name
  "tags": "Categories", // CSV column for tags (comma-separated)
  "model": "CardType", // CSV column for Anki model
  "difficulty": "Level" // CSV column for difficulty level
}
```

### Import Options

```json
{
  "delimiter": ",", // CSV delimiter character
  "defaultDeck": "Study", // Default deck if not specified
  "defaultModel": "Basic", // Default Anki model
  "defaultTags": ["imported"], // Default tags for all cards
  "dryRun": false // Preview mode without creating cards
}
```

## 🎯 Best Practices

### 1. Prepare Your CSV File

**✅ Good practices:**

- Use quotes around text containing commas: `"Hello, world"`
- Escape quotes with double quotes: `"He said ""Hello"""`
- Include headers in first row
- Use consistent column names
- Test with small file first

**❌ Avoid:**

- Special characters in deck/tag names
- Very long text without line breaks
- Missing required fields (Front, Back)

### 2. Content Formatting

**Code blocks in CSV:**

````csv
Front,Back
"What does this JavaScript do?
```javascript
const factorial = n => n <= 1 ? 1 : n * factorial(n-1);
```","Recursive factorial function using arrow syntax"
````

**Multiple tags:**

```csv
Front,Back,Tags
"What is React?","JavaScript library","react,javascript,frontend,library"
```

### 3. Deck Organization

**Create decks before importing:**

```bash
# Create deck in Anki first, then import
ankiniki import cards.csv --deck "New Technology"
```

**Use consistent naming:**

```csv
Front,Back,Deck
"Question 1","Answer 1","JavaScript Fundamentals"
"Question 2","Answer 2","JavaScript Fundamentals"
```

## 🔧 CLI Usage Examples

### Basic Import

```bash
# Import with default settings
ankiniki import flashcards.csv

# Specify target deck
ankiniki import flashcards.csv --deck "Programming"

# Add default tags
ankiniki import flashcards.csv --tags "imported,study-guide"
```

### Preview Before Import

```bash
# Preview file structure and sample cards
ankiniki import flashcards.csv --preview

# Check for errors without creating cards
ankiniki import flashcards.csv --dry-run
```

### Custom Delimiters

```bash
# Semicolon-separated values
ankiniki import data.csv --delimiter ";"

# Tab-separated values
ankiniki import data.tsv --delimiter "\t"
```

### Custom Column Mapping

```bash
# Map non-standard column names
ankiniki import study-guide.csv \
  --mapping '{"front": "Term", "back": "Definition", "deck": "Chapter"}'

# Complex mapping with all fields
ankiniki import comprehensive.csv \
  --mapping '{
    "front": "Question",
    "back": "Explanation",
    "deck": "Course",
    "tags": "Keywords",
    "difficulty": "Complexity"
  }'
```

## 📋 Column Mapping Reference

Use the `ankiniki import mapping` command to see examples:

```bash
ankiniki import mapping
```

### Standard Columns

| Column       | Description            | Required | Example              |
| ------------ | ---------------------- | -------- | -------------------- |
| `Front`      | Question/front of card | ✅       | "What is React?"     |
| `Back`       | Answer/back of card    | ✅       | "JavaScript library" |
| `Deck`       | Target Anki deck       | ❌       | "JavaScript"         |
| `Tags`       | Comma-separated tags   | ❌       | "react,frontend"     |
| `Model`      | Anki card model        | ❌       | "Basic"              |
| `Difficulty` | Learning difficulty    | ❌       | "beginner"           |

### Custom Column Names

Map any column names to standard fields:

```csv
Question,Answer,Subject,Keywords,Level
"What is Docker?","Container platform","DevOps","docker,containers","intermediate"
```

## 🐛 Troubleshooting

### Common Issues

**1. Import fails with "Deck does not exist"**

```bash
# Solution: Create deck in Anki first or specify existing deck
ankiniki import cards.csv --deck "Existing Deck Name"
```

**2. Special characters causing parsing errors**

```bash
# Solution: Use proper quoting and escaping
"Text with ""quotes"" and, commas","Answer with special chars"
```

**3. Large files timing out**

```bash
# Solution: Split large files or use API directly
split -l 1000 large-file.csv smaller-file-
```

**4. Column mapping not working**

```bash
# Solution: Check JSON syntax
ankiniki import cards.csv --mapping '{"front": "Question"}' # Valid JSON
ankiniki import cards.csv --mapping "{front: Question}"     # Invalid JSON
```

### Validation Errors

**Missing required fields:**

```
Row 5: Front field is required
Row 12: Back field is required
```

**Invalid deck names:**

```
Row 3: Deck 'Non-existent Deck' does not exist
```

**Preview before import to catch errors:**

```bash
ankiniki import cards.csv --preview
```

## 📈 Performance Tips

### For Large Files

- **Split files**: Keep under 1000 cards per file
- **Use preview**: Test with `--preview` first
- **Batch processing**: Import in smaller chunks
- **Validate data**: Check CSV format before import

### Optimization

```bash
# Good: Small batch with preview
ankiniki import batch-1.csv --preview
ankiniki import batch-1.csv

# Better: Optimized for specific use case
ankiniki import cards.csv --deck "Target Deck" --model "Basic"
```

## 🎉 Success Stories

### Migrating from Other Systems

```bash
# Export from Quizlet/other system as CSV
# Map columns to Ankiniki format
ankiniki import quizlet-export.csv \
  --mapping '{"front": "Term", "back": "Definition"}' \
  --deck "Migrated Cards" \
  --tags "migrated,quizlet"
```

### Bulk Content Creation

```bash
# Create cards from documentation/study guides
ankiniki import course-material.csv --deck "Computer Science 101"
# Result: 500+ cards imported in seconds
```

---

## Summary

CSV import in Ankiniki provides:

- **Bulk card creation** from spreadsheets
- **Flexible column mapping** for any CSV format
- **Preview and validation** before import
- **CLI and API** access methods
- **Error handling** with detailed feedback

Perfect for migrating existing study materials or creating large sets of flashcards efficiently! 🚀
