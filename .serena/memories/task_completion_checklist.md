# Task Completion Checklist

## Definition of Done
Before marking any development task as complete, ensure ALL of the following are satisfied:

### ✅ Code Quality Gates
- [ ] **TypeScript Compilation**: `npm run type-check` passes without errors
- [ ] **Linting**: `npm run lint` passes without warnings  
- [ ] **Formatting**: `npm run format:check` confirms code is properly formatted
- [ ] **Complete Quality Check**: `npm run check` passes (combines all above)

### ✅ Testing Requirements  
- [ ] **Unit Tests**: Relevant tests added/updated for new functionality
- [ ] **Test Execution**: `npm run test` passes for affected packages
- [ ] **Manual Testing**: Feature tested manually in appropriate environment
- [ ] **AnkiConnect Integration**: If relevant, tested with Anki running

### ✅ Build and Integration
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Workspace Dependencies**: All internal dependencies properly updated
- [ ] **No Breaking Changes**: Existing functionality remains intact
- [ ] **Git Hooks Pass**: Pre-commit hooks execute successfully

### ✅ Documentation and Communication
- [ ] **Code Comments**: Complex logic properly documented (if warranted)
- [ ] **README Updates**: User-facing changes documented
- [ ] **API Changes**: Breaking changes noted and versioned appropriately  
- [ ] **Change Description**: Clear commit messages or PR descriptions

## Pre-Commit Automated Checks
The following are automatically enforced by git hooks:
- ESLint auto-fixes applied
- Prettier formatting applied  
- Staged files only (no full project formatting)
- TypeScript compilation validation

## Validation Commands
```bash
# Run complete validation pipeline
npm run ci

# Individual validation steps  
npm run type-check     # TypeScript errors
npm run lint           # Code quality issues
npm run format:check   # Formatting problems
npm run test           # Test failures
npm run build          # Build errors
```

## Quality Standards
- **Zero ESLint Warnings**: All linting issues resolved
- **Consistent Formatting**: Prettier rules followed
- **Type Safety**: No TypeScript `any` types (use `unknown`)
- **Error Handling**: Proper error boundaries and validation
- **Performance**: No obvious performance regressions

## When to Skip Quality Gates
**NEVER** skip quality gates except in true emergencies. If quality checks fail:
1. Fix the underlying issue
2. Update tests if behavior changed intentionally  
3. Update documentation if public APIs changed
4. Only use `git commit --no-verify` as absolute last resort

## Package-Specific Considerations
- **Shared Package**: Must maintain backward compatibility
- **Backend**: API contract compliance and error handling
- **Desktop**: Electron security best practices
- **CLI**: User experience and error messages