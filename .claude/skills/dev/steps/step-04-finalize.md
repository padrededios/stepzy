---
name: step-04-finalize
description: Phase de finalisation - vérification complète et rapport
next_step: null
---

# Phase 4: Finalize

**Role: QUALITY GUARDIAN** - Ensure everything is complete and working

---

<available_state>
From previous steps:
- Unit tests passing
- Integration tests passing
- All features implemented
- Routes registered
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- ✅ ALL tests must pass - unit AND integration
- 📊 COVERAGE must meet threshold - minimum 80%
- 📝 DOCUMENTATION must be updated
- 🔍 FINAL review of all code
- 🚫 FORBIDDEN: Declaring complete with failing tests
</mandatory_rules>

---

## Actions

### 4.1 Exécuter tous les tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Verify coverage threshold
# Statements: >= 80%
# Branches: >= 80%
# Functions: >= 80%
# Lines: >= 80%
```

### 4.2 Vérification TypeScript

```bash
# No type errors
npx tsc --noEmit

# Should output: no errors
```

### 4.3 Lint check

```bash
# ESLint
npx eslint backend/src/services/{feature}.service.ts
npx eslint backend/src/routes/{feature}.routes.ts

# Should be clean
```

### 4.4 Final code review

Checklist :
- [ ] Pas de `any` types
- [ ] Gestion d'erreurs appropriée
- [ ] Logging en place
- [ ] Pas de TODO oubliés
- [ ] Nommage cohérent
- [ ] Pas de code mort

### 4.5 Documentation

```typescript
/**
 * Service for managing {Feature} entities.
 *
 * @example
 * const feature = await {feature}Service.create({ name: 'Test' });
 * const found = await {feature}Service.getById(feature.id);
 */
export class {Feature}Service {
  /**
   * Creates a new {feature}.
   * @param input - The {feature} data
   * @returns The created {feature}
   * @throws {ValidationError} If input is invalid
   */
  async create(input: Create{Feature}Input): Promise<{Feature}> {
    // ...
  }
}
```

---

## Final Report

```markdown
## 🚀 Rapport d'implémentation : {Feature}

### Résumé
- **Spec**: `docs/specs/{feature}.md`
- **Date**: [YYYY-MM-DD]
- **Status**: ✅ Complete

### Métriques

#### Tests
| Type | Total | Passing | Coverage |
|------|-------|---------|----------|
| Unit | [X] | [X] | [X]% |
| Integration | [X] | [X] | - |
| **Total** | [X] | [X] | [X]% |

#### Code
| Metric | Value |
|--------|-------|
| Files created | [X] |
| Files modified | [X] |
| Lines added | [X] |
| Lines removed | [X] |

### Fonctionnalités Implémentées

| Feature | Status | Tests |
|---------|--------|-------|
| Create {feature} | ✅ | 3/3 |
| Read {feature} | ✅ | 2/2 |
| Update {feature} | ✅ | 3/3 |
| Delete {feature} | ✅ | 2/2 |
| List {feature} | ✅ | 2/2 |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/{feature} | Yes | Create new |
| GET | /api/{feature}/:id | Yes | Get by ID |
| PUT | /api/{feature}/:id | Yes | Update |
| DELETE | /api/{feature}/:id | Yes | Delete |
| GET | /api/{feature} | Yes | List all |

### Fichiers Créés
```
backend/
├── src/
│   ├── services/{feature}.service.ts     ✅
│   ├── routes/{feature}.routes.ts        ✅
│   ├── schemas/{feature}.schema.ts       ✅
│   └── types/{feature}.types.ts          ✅
└── tests/
    ├── unit/{feature}/
    │   └── {feature}.service.test.ts     ✅
    └── integration/
        └── {feature}.api.test.ts         ✅
```

### Fichiers Modifiés
- `backend/src/app.ts` - Added routes
- `prisma/schema.prisma` - Added model (if applicable)

### Vérifications Finales
- [x] Tous les tests passent
- [x] Couverture >= 80%
- [x] Pas d'erreurs TypeScript
- [x] Lint propre
- [x] Documentation ajoutée
- [x] Pas de TODOs

### Prochaines Étapes
- [ ] Exécuter migration Prisma : `npx prisma migrate dev`
- [ ] Vérifier en staging
- [ ] Mettre à jour le CHANGELOG
- [ ] Créer la PR

### Commandes Utiles
```bash
# Tests
npm test -- --testPathPattern="{feature}"

# Migration (si nouveau modèle)
npx prisma migrate dev --name add_{feature}

# Générer types Prisma
npx prisma generate
```
```

---

## Commit Final

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat({feature}): complete implementation with TDD

## Summary
- Full CRUD operations for {feature}
- Unit tests: [X] passing
- Integration tests: [X] passing
- Coverage: [X]%

## Changes
- Add {Feature}Service with CRUD methods
- Add API routes for {feature}
- Add Zod validation schemas
- Add comprehensive test suite

## Spec
Implements: docs/specs/{feature}.md

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 🎉 Implémentation Terminée

La feature a été implémentée en suivant le TDD strict :
- ✅ Tous les tests passent
- ✅ Couverture satisfaisante
- ✅ Code propre et documenté
- ✅ Prêt pour review

→ **Session terminée**
