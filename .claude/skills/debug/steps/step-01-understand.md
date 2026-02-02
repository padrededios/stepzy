---
name: step-01-understand
description: Phase de compréhension - collecter toutes les preuves
next_step: steps/step-02-reproduce.md
---

# Phase 1: Understand

**Role: DETECTIVE** - Gather all evidence about the bug without making assumptions

---

<available_state>
From SKILL.md entry point:
- `{problem}` - The bug description or error message
- `{economy_mode}` - If true, use direct tool calls instead of subagents
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔍 COLLECT without judging - gather all information first
- 📋 DOCUMENT everything - error messages, stack traces, context
- 🎯 IDENTIFY affected components - trace the impact radius
- 📊 ESTABLISH timeline - when did it start? what changed?
- 🚫 FORBIDDEN: Making assumptions about the cause at this stage
</mandatory_rules>

---

## Actions

### 1.1 Parse le problème

Analyse le `{problem}` fourni :
- Est-ce un message d'erreur ? → Extrais le type, message, stack trace
- Est-ce une référence fichier:ligne ? → Note le contexte
- Est-ce une description textuelle ? → Identifie les mots-clés techniques

### 1.2 Recherche de preuves

Lance ces recherches en parallèle :

```
[PARALLEL AGENTS if not economy_mode]

Agent 1 - Error Search:
- Grep le message d'erreur exact dans les logs
- Grep le type d'erreur dans la codebase
- Cherche des try/catch qui pourraient masquer l'erreur

Agent 2 - File Context:
- Identifie les fichiers mentionnés dans la stack trace
- Lis les fichiers impliqués (fonctions, classes)
- Note les imports et dépendances

Agent 3 - Recent Changes:
- git log -p sur les fichiers suspects
- git blame sur les lignes problématiques
- Identifie les commits récents qui pourraient être la cause

Agent 4 - Similar Issues:
- Cherche des patterns d'erreur similaires dans la codebase
- Vérifie si ce bug a déjà été résolu ailleurs
- Cherche dans les commentaires/TODOs
```

### 1.3 Établir le contexte

Documente :
- **Environnement** : dev/staging/prod, versions, configuration
- **Timing** : Quand le bug a commencé, fréquence
- **Impact** : Qui est affecté, quelle fonctionnalité

### 1.4 Hypothèses initiales

Liste les causes possibles (sans les valider encore) :
- Hypothèse A: [...]
- Hypothèse B: [...]
- Hypothèse C: [...]

---

## Output de cette phase

```markdown
## Understanding Report

### Error Details
- Type: [ErrorType]
- Message: [Full error message]
- Stack Trace:
  ```
  [Stack trace if available]
  ```

### Affected Components
- Files: [list]
- Functions: [list]
- Dependencies: [list]

### Context
- Environment: [...]
- First occurrence: [...]
- Frequency: [always/sometimes/rare]

### Initial Hypotheses
1. [Hypothesis A] - Confidence: [low/medium/high]
2. [Hypothesis B] - Confidence: [low/medium/high]
3. [Hypothesis C] - Confidence: [low/medium/high]

### Files to Investigate
- [ ] file1.ts - reason
- [ ] file2.ts - reason
```

---

→ **Next**: `step-02-reproduce.md` - Create a reliable reproduction
