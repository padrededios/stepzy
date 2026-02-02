---
name: debug
description: Diagnostiquer et résoudre un bug de manière méthodique avec analyse approfondie
argument-hint: "[description-bug ou fichier:ligne]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
recommended-model: sonnet
---

# Skill Debug - Diagnostic et Résolution de Bugs

Tu es un expert en debugging avec une approche scientifique. Tu vas diagnostiquer et résoudre le problème de manière méthodique.

## Arguments

- `$ARGUMENTS` : Description du bug, message d'erreur, ou référence fichier:ligne

## Available State

- `{problem}` - Description du problème ou erreur
- `{economy_mode}` - Si true, utilise des appels directs au lieu de subagents
- `{fast_mode}` - Si true, skip la phase d'exploration étendue
- `{save_session}` - Si true, sauvegarde la session de debug
- `{session_path}` - Chemin pour sauvegarder la session (default: `docs/debug-sessions/`)

---

<mandatory_rules>
## RÈGLES D'EXÉCUTION OBLIGATOIRES (LIRE EN PREMIER)

- 🔬 DIAGNOSE before fixing - never assume the cause
- 🎯 REPRODUCE the bug first - you cannot fix what you cannot see
- 📊 COLLECT evidence systematically - logs, stack traces, state
- 🔍 TRACE the execution path - follow the data flow
- ⚠️ VERIFY the fix - ensure it doesn't break other things
- 🚫 FORBIDDEN: Fixing without understanding root cause
</mandatory_rules>

---

## Workflow

### Phase 1: Understand → `steps/step-01-understand.md`

**Role: DETECTIVE** - Gather all evidence about the bug

1. Parse la description du bug
2. Identifie les fichiers/composants potentiellement impliqués
3. Recherche les logs d'erreur et stack traces
4. Établis une timeline si possible

### Phase 2: Reproduce → `steps/step-02-reproduce.md`

**Role: SCIENTIST** - Create a reliable reproduction

1. Crée un cas de test minimal qui reproduit le bug
2. Documente les conditions exactes de reproduction
3. Identifie les variables qui affectent le bug

### Phase 3: Investigate → `steps/step-03-investigate.md`

**Role: FORENSIC ANALYST** - Deep dive into the code

1. Lance des agents parallèles pour explorer :
   - Agent 1: Trace le flux de données
   - Agent 2: Analyse les dépendances
   - Agent 3: Cherche des patterns similaires dans la codebase
   - Agent 4: Vérifie l'historique git du code concerné
2. Identifie la root cause

### Phase 4: Fix → `steps/step-04-fix.md`

**Role: SURGEON** - Precise, minimal intervention

1. Propose une solution minimale
2. Implémente le fix
3. Écris un test qui aurait détecté ce bug

### Phase 5: Verify → `steps/step-05-verify.md`

**Role: QUALITY GUARDIAN** - Ensure complete resolution

1. Vérifie que le bug est résolu
2. Exécute la suite de tests complète
3. Vérifie les régressions potentielles
4. Documente la résolution

---

## Quick Start

```bash
# Debug un message d'erreur
/debug "TypeError: Cannot read property 'id' of undefined"

# Debug un fichier spécifique
/debug "backend/src/services/user.service.ts:42"

# Debug avec mode rapide
/debug "login ne fonctionne plus" --fast
```

## Output

### Debug Session Report

```markdown
## 🔍 Debug Session: [Bug Description]

### 1. Symptômes
- Message d'erreur: [...]
- Comportement observé: [...]
- Comportement attendu: [...]

### 2. Reproduction
- Étapes pour reproduire: [...]
- Conditions requises: [...]
- Fréquence: [always/intermittent/rare]

### 3. Investigation
- Fichiers analysés: [...]
- Root cause identifiée: [...]
- Explication technique: [...]

### 4. Solution
- Fichiers modifiés: [...]
- Description du fix: [...]
- Test ajouté: [...]

### 5. Vérification
- [ ] Bug résolu
- [ ] Tests passent
- [ ] Pas de régression
- [ ] Documentation mise à jour

### 6. Prévention
- Comment éviter ce bug à l'avenir: [...]
- Améliorations suggérées: [...]
```

## Anti-patterns

❌ **Ne fais JAMAIS ça** :
- Fixer sans comprendre la root cause
- Ignorer les effets de bord
- Modifier plusieurs choses à la fois
- Oublier d'écrire un test de régression
- Hardcoder des valeurs pour "fixer" rapidement

✅ **Fais TOUJOURS ça** :
- Reproduis d'abord le bug
- Un fix = un changement ciblé
- Vérifie les cas limites
- Documente pourquoi le bug existait
- Commit avec message explicatif
