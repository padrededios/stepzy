---
name: step-07-finalize
description: Phase de finalisation - commits, documentation et rapport
next_step: null
---

# Phase 7: Finalize

**Role: RELEASE MANAGER** - Complete the work and prepare for merge

---

<available_state>
From previous step:
- All validation checks passing
- All fixes applied
- Implementation complete
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- ✅ VERIFY one last time - double-check everything passes
- 📝 CLEAN commits - squash if needed, good messages
- 📚 UPDATE docs - README, CHANGELOG if applicable
- 📋 CREATE summary - what was done, what changed
- 🚫 FORBIDDEN: Finalizing with any failing checks
</mandatory_rules>

---

## Actions

### 7.1 Vérification finale

```bash
# One last full check
npm test && npx tsc --noEmit && npm run lint && npm run build

# Should all pass - if not, return to Fix phase
```

### 7.2 Review des commits

```bash
# List all commits on this branch
git log main..HEAD --oneline

# Example output:
# abc123 feat(notifications): add Prisma model
# def456 feat(notifications): add service with TDD
# ghi789 feat(notifications): add API routes
# jkl012 feat(notifications): add integration tests
# mno345 fix(notifications): resolve TypeScript error
```

### 7.3 Optionnel: Squash commits (si demandé)

```bash
# Si l'utilisateur préfère un seul commit
git rebase -i main

# Ou garder les commits atomiques (recommandé pour review)
```

### 7.4 Commit message final (si squash)

```bash
git commit --amend -m "$(cat <<'EOF'
feat({feature}): {short description}

## Summary
{2-3 sentences describing what this adds/changes}

## Changes
- Add {Feature} Prisma model
- Add {Feature}Service with CRUD operations
- Add API routes for {feature}
- Add comprehensive test suite

## Tests
- Unit tests: X passing
- Integration tests: X passing
- Coverage: XX%

## Files
- New: X files
- Modified: X files

Implements: {requirement}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 7.5 Mettre à jour la documentation (si applicable)

```bash
# Si CHANGELOG existe
if [ -f CHANGELOG.md ]; then
  # Add entry for this feature
  echo "Update CHANGELOG.md"
fi

# Si README needs update
if grep -q "{feature}" README.md 2>/dev/null; then
  echo "README may need update"
fi
```

### 7.6 Générer le rapport final

```markdown
## 🚀 Autopilot Mission Complete

### Mission
**Requirement**: "{requirement}"

### Branch
`{branch_name}`

### Status
✅ **COMPLETE** - Ready for review/merge

---

### Summary
[Brief description of what was accomplished]

---

### Changes Made

#### Files Created
| File | Purpose |
|------|---------|
| `src/services/{feature}.service.ts` | Business logic |
| `src/routes/{feature}.routes.ts` | API endpoints |
| `src/schemas/{feature}.schema.ts` | Validation |
| `tests/unit/{feature}.test.ts` | Unit tests |
| `tests/integration/{feature}.api.test.ts` | API tests |

#### Files Modified
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added {Feature} model |
| `src/app.ts` | Registered routes |

#### Lines of Code
- Added: +[X] lines
- Removed: -[Y] lines
- Net: [Z] lines

---

### Test Results
```
Test Suites: X passed, 0 failed
Tests: X passed, 0 failed
Snapshots: 0 total
Coverage: XX%
```

---

### Commits
```
{list of commits}
```

---

### Phases Completed
| Phase | Status | Notes |
|-------|--------|-------|
| 1. Init | ✅ | Branch created |
| 2. Plan | ✅ | X tasks identified |
| 3. Prepare | ✅/⏭️ | [Docs created/Skipped] |
| 4. Implement | ✅ | X tasks completed |
| 5. Validate | ✅ | All checks pass |
| 6. Fix | ✅/⏭️ | [X issues fixed/No issues] |
| 7. Finalize | ✅ | Report generated |

---

### Issues Encountered & Resolved
| Issue | Resolution |
|-------|------------|
| [issue 1] | [how resolved] |
| [issue 2] | [how resolved] |

---

### Next Steps

1. **Create Pull Request**
   ```bash
   gh pr create --title "feat({feature}): {description}" --body "..."
   ```

2. **Request Review**
   ```bash
   gh pr edit --add-reviewer @teammate
   ```

3. **After Approval**
   ```bash
   gh pr merge --squash
   ```

---

### Commands Reference
```bash
# View changes
git diff main...{branch_name}

# View commits
git log main..{branch_name} --oneline

# Create PR
gh pr create

# Switch back to main
git checkout main && git pull
```

---

🎉 **Mission Accomplished!**

The {feature} has been successfully implemented following TDD practices.
All tests pass, code compiles, and is ready for review.
```

---

### 7.7 Afficher le résumé à l'utilisateur

```markdown
## ✅ Autopilot Complete!

**Branch**: `{branch_name}`
**Status**: Ready for review

### Quick Stats
- Tasks: [X]/[X] ✅
- Tests: [X] passing
- Coverage: [X]%
- Commits: [X]

### Next Step
```bash
# Create PR
gh pr create --title "feat: {short description}"

# Or view changes first
git log main..HEAD --oneline
```

---

Voulez-vous que je crée la PR automatiquement ?
```

---

## 🎉 Autopilot Mission Complete

L'agent a terminé avec succès :
- ✅ Branche créée et isolée
- ✅ Plan exécuté
- ✅ Code implémenté en TDD
- ✅ Tous les tests passent
- ✅ Code compile sans erreur
- ✅ Lint propre
- ✅ Commits atomiques

→ **Session terminée**
