# Gemini CLI Mandates & Workflow

This document outlines the standard development workflow and project-specific instructions for the **ankiniki** project when working with Gemini CLI.

## Foundational Mandates

- **Git Flow:** Follow the GitHub-flow model described in the [Development Workflow](#development-workflow) section.
- **Commit Messages:** Adhere strictly to the [Commit Message Convention](#3-commit-message-convention).
- **PR Process:** Follow the [Pull Request Process](#5-pull-request-process) including the specific body template.
- **Attribution:** Always include Gemini CLI attribution in commits and PRs.

---

## Development Workflow

### 1. Create GitHub Issue

**Purpose:** Track work, provide context, and enable auto-linking with PRs.

```bash
gh issue create --title "{Description}" --label "{label}" --body "..."
```

**Best Practices:**

- Use clear, descriptive titles.
- Include summary, requirements, and benefits.
- Add appropriate labels: `enhancement`, `bug`, etc.

### 2. Branch Naming Convention

**Format:** `feature/issue-{NUMBER}_{brief-description}`

**Commands:**

```bash
# Always start from main
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/issue-{NUMBER}_{description}
```

### 3. Commit Message Convention

**Format:**

```
#{ISSUE_NUMBER} {Short description}

- Bullet point of change 1
- Bullet point of change 2

🤖 Generated with [Gemini CLI](https://github.com/google-gemini/gemini-cli)
```

**Best Practices:**

- Start with `#{ISSUE_NUMBER}` (e.g., `#1`).
- Use present tense ("Add feature" not "Added feature").
- Keep first line under 72 characters.
- **Commit periodically** - don't wait until the end.

### 4. Pull Request Process

**Step 1: Push Branch**

```bash
git push origin feature/issue-{NUMBER}_{description}
```

**Step 2: Create PR**

```bash
gh pr create --title "#{NUMBER} {Description}" --body "..." --base main
```

**PR Title Format:** `#{ISSUE_NUMBER} {Description}`

**PR Body Template:**

```markdown
## Summary

{Brief overview of changes}

## Changes

### {Category 1}

- ✅ Change 1

## Test Results

- ✅ All tests passing (X/X)
- ✅ Build verified successful

## Files Changed

- X files changed: +XXX insertions, -XXX deletions

Closes #{ISSUE_NUMBER}

🤖 Generated with [Gemini CLI](https://github.com/google-gemini/gemini-cli)
```

### 5. After Merge

**Clean up local branches:**

```bash
git checkout main && git pull origin main
git branch -d feature/issue-{NUMBER}_{description}
```

---

## Tips for Gemini CLI

- **Research First:** Use `grep_search` to understand existing patterns before implementing.
- **Verify:** Always run `npm test` or `npm run build` before committing.
- **Atomic Commits:** Keep commits focused on a single logical change.
- **Context:** If you need to refresh on this workflow, refer back to this `GEMINI.md` file.
