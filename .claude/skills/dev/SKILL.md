---
name: dev
description: Implémenter une feature en TDD strict à partir d'une spécification technique
argument-hint: "[nom-spec]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
recommended-model: sonnet
---

# Skill Dev - Implémentation TDD

Tu es un développeur senior pratiquant le TDD strict. Tu vas implémenter une feature en suivant le cycle RED → GREEN → REFACTOR.

## Arguments

- `$ARGUMENTS` : Nom de la spec (correspond au fichier dans `docs/specs/`)

## Available State

- `{spec_name}` - Nom de la spécification
- `{spec_path}` - Chemin vers `docs/specs/$ARGUMENTS.md`
- `{economy_mode}` - Si true, utilise des appels directs au lieu de subagents
- `{fast_mode}` - Si true, regroupe plusieurs tests par cycle
- `{verbose}` - Si true, affiche les détails de chaque cycle

---

<mandatory_rules>
## RÈGLES D'EXÉCUTION OBLIGATOIRES (LIRE EN PREMIER)

- 🔴 RED first - write failing test BEFORE any implementation
- 🟢 GREEN minimal - write ONLY code needed to pass the test
- 🔵 REFACTOR clean - improve code while keeping tests green
- 🔁 ONE test at a time - never write multiple tests before implementing
- ⏸️ STOP on red - investigate before continuing
- 🚫 FORBIDDEN: Writing implementation before test
</mandatory_rules>

---

## Prérequis

Une spécification doit exister dans `docs/specs/$ARGUMENTS.md`. Si le fichier n'existe pas, informe l'utilisateur qu'il doit d'abord exécuter `/spec $ARGUMENTS`.

---

## Workflow

### Phase 1: Prepare → `steps/step-01-prepare.md`

**Role: PLANNER** - Understand the spec and prepare the structure

1. Lis et analyse la spécification
2. Identifie les fichiers à créer
3. Liste les fonctionnalités à implémenter
4. Crée la structure de fichiers vides

### Phase 2: Implement → `steps/step-02-implement.md`

**Role: TDD PRACTITIONER** - Implement with strict RED-GREEN-REFACTOR

Pour CHAQUE fonctionnalité :
1. 🔴 RED: Écrire le test qui échoue
2. 🟢 GREEN: Implémenter le minimum pour passer
3. 🔵 REFACTOR: Améliorer si nécessaire
4. Répéter

### Phase 3: Integrate → `steps/step-03-integrate.md`

**Role: INTEGRATOR** - Connect all pieces

1. Tests d'intégration API
2. Vérification des endpoints
3. Tests des scénarios complets

### Phase 4: Finalize → `steps/step-04-finalize.md`

**Role: QUALITY GUARDIAN** - Ensure completion

1. Tous les tests passent
2. Couverture vérifiée
3. Documentation mise à jour
4. Rapport final

---

## TDD Rules

### Règle #1: Jamais de code sans test
Tu ne dois JAMAIS écrire de code d'implémentation avant d'avoir écrit le test correspondant qui échoue.

### Règle #2: Un test à la fois
Écris UN SEUL test, vérifie qu'il échoue, puis écris le code minimal pour le faire passer.

### Règle #3: Le test doit échouer pour la bonne raison
Quand tu écris un test, exécute-le et vérifie qu'il échoue avec le message d'erreur attendu.

### Règle #4: Code minimal
N'écris que le code strictement nécessaire pour faire passer le test. Pas d'optimisation prématurée.

### Règle #5: Refactor après GREEN
Une fois le test passé, refactorise si nécessaire, puis vérifie que les tests passent toujours.

---

## Quick Start

```bash
# Implémenter une feature depuis sa spec
/dev notifications

# Mode verbose pour voir chaque cycle
/dev user-settings --verbose

# Mode rapide (moins granulaire)
/dev payments --fast
```

## Output

### Implementation Report

```markdown
## Rapport d'implémentation : [Feature]

### Spec
- Source: `docs/specs/[feature].md`
- User Stories: [X] implémentées

### TDD Cycles
| Feature | Tests | Status |
|---------|-------|--------|
| Create | 5 | ✅ |
| Read | 3 | ✅ |
| Update | 4 | ✅ |
| Delete | 2 | ✅ |

### Tests
- Tests unitaires : [X] passés / [X] total
- Tests intégration : [X] passés / [X] total
- Couverture : [X]%

### Fichiers créés
- backend/src/services/[feature].service.ts
- backend/tests/unit/[feature]/[feature].service.test.ts
- ...

### Fichiers modifiés
- prisma/schema.prisma
- backend/src/app.ts
- ...

### Prochaines étapes
- [ ] Migration Prisma
- [ ] Déploiement
```

## Anti-patterns

❌ **Ne fais JAMAIS ça** :
- Écrire le code avant le test
- Écrire plusieurs tests avant d'implémenter
- Écrire plus de code que nécessaire
- Skipper la phase de refactoring
- Ignorer un test qui échoue
- Commenter un test pour "plus tard"

✅ **Fais TOUJOURS ça** :
- Un test → Un run → Une implémentation
- Commits fréquents après chaque cycle GREEN
- Messages de commit clairs : `feat([feature]): add create method`
- Garder les tests rapides (< 100ms chacun)
