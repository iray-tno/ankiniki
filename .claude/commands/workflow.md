# Development Workflow

This document outlines the standard development workflow for the ankiniki project when working with Claude Code.

## Overview

Follow this workflow for all feature development, bug fixes, and improvements:

1. Create GitHub Issue
2. Create Feature Branch
3. Implement Changes
4. Commit Periodically
5. Push and Create PR
6. Merge and Clean Up

---

## 1. Create GitHub Issue

**Purpose:** Track work, provide context, and enable auto-linking with PRs.

```bash
gh issue create --title "{Description}" --label "{label}" --body "..."
```

**Best Practices:**

- Use clear, descriptive titles
- Include summary, requirements, and benefits
- Add appropriate labels: `enhancement`, `bug`, etc.
- Create checklist for multi-step tasks

**Example:**

```bash
gh issue create --title "Fix formatting and add Prettier config" --label "enhancement"
```

---

## 2. Branch Naming Convention

**Format:** `feature/issue-{NUMBER}_{brief-description}`

**Examples:**

- `feature/issue-1_formatting-cleanup`
- `feature/issue-2_add-json-import`
- `feature/issue-3_workflow-setup`

**Commands:**

```bash
# Always start from main
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/issue-{NUMBER}_{description}
```

---

## 3. Commit Message Convention

**Format:**

```
#{ISSUE_NUMBER} {Short description}

- Bullet point of change 1
- Bullet point of change 2
- Bullet point of change 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Best Practices:**

- Start with `#{ISSUE_NUMBER}` (e.g., `#1`)
- Use present tense ("Add feature" not "Added feature")
- Keep first line under 72 characters
- Include detailed bullet points in body
- **Commit periodically** - don't wait until the end
- Always include Claude Code attribution

**Example:**

```bash
git commit -m "#1 Fix trailing newlines and formatting

- Add trailing newlines to .mcp.json, .prettierrc.js, tsconfig.json
- Normalize list markers in markdown docs
- Fix whitespace in .claude.md sections

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## 4. Implementation & Periodic Commits

**Key Principle:** Commit early and often

**Workflow:**

1. Make logical changes
2. Commit when you complete a coherent step
3. Don't batch multiple unrelated changes
4. Each commit should be a working state

---

## 5. Pull Request Process

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
- ✅ Change 2

### {Category 2}

- ✅ Change 3

## Test Results

- ✅ All tests passing (X/X)
- ✅ Build verified successful
- ✅ {Other validations}

## Files Changed

- X files changed: +XXX insertions, -XXX deletions

## Commits

1. #{NUMBER} {First commit summary}
2. #{NUMBER} {Second commit summary}
   ...

## Benefits

- **Benefit 1:** Description
- **Benefit 2:** Description

Closes #{ISSUE_NUMBER}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Important:**

- **CRITICAL:** Include `Closes #{ISSUE_NUMBER}` in the PR body to automatically close the issue when merged
  - GitHub supports keywords: `Closes`, `Fixes`, or `Resolves` (e.g., `Closes #123`, `Fixes #123`, `Resolves #123`)
  - This must be in the PR description, not just commit messages
  - When the PR is merged, GitHub will automatically close the referenced issue
- Always use `--base main`
- Review the PR URL that's returned

---

## 6. After Merge

**Clean up local branches:**

```bash
# Switch back to main
git checkout main

# Pull latest changes
git pull origin main

# Delete local feature branch
git branch -d feature/issue-{NUMBER}_{description}
```

**Verify:**

- Issue is automatically closed (if PR used `Closes #xxx` in description)
- Changes are in main
- All CI checks pass

**Note:** If the issue wasn't automatically closed, you can manually close it:

```bash
gh issue close {NUMBER} --comment "Closed by #{PR_NUMBER}"
```

---

## Quick Reference

```bash
# 1. Create issue
gh issue create --title "..." --label "enhancement"

# 2. Create branch from main
git checkout main && git pull
git checkout -b feature/issue-{N}_{desc}

# 3. Implement & commit periodically
# ... make changes ...
git add {files}
git commit -m "#{N} {Description}

- Change 1
- Change 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 4. Push and create PR
git push origin feature/issue-{N}_{desc}
gh pr create --title "#{N} {Desc}" --body "..." --base main

# 5. After merge
git checkout main && git pull
git branch -d feature/issue-{N}_{desc}
```

---

## Tips for Claude Code

- Always check recent commits to follow existing patterns: `git log --oneline -10`
- Use `gh issue view {NUMBER}` to check issue details
- Verify branch name before creating: `git branch --show-current`
- Test before committing: `npm test`, `npm run build`
- Keep commits atomic and focused
- Update issue checklist as you progress
- See `CLAUDE.md` at project root for full architecture and tips

---

## Accessing This Workflow

Use the `/workflow` slash command in Claude Code to view this documentation at any time.
