---
name: step-03-investigate
description: Phase d'investigation - analyse approfondie pour trouver la root cause
next_step: steps/step-04-fix.md
---

# Phase 3: Investigate

**Role: FORENSIC ANALYST** - Deep systematic analysis to find the root cause

---

<available_state>
From previous steps:
- Understanding Report with hypotheses
- Reproduction Report with test case
- List of files to investigate
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔬 ANALYZE systematically - follow the execution path step by step
- 🌳 TRACE data flow - input → processing → output
- 📊 VALIDATE hypotheses - prove or disprove each one
- 🔗 FIND the root - symptoms ≠ cause, dig deeper
- 🚫 FORBIDDEN: Stopping at first suspicious code without verification
</mandatory_rules>

---

## Actions

### 3.1 Lancer l'investigation parallèle

```
[PARALLEL AGENTS - Maximum coverage mode]

Agent 1 - Data Flow Tracer:
=========================
Mission: Trace le flux de données de l'input jusqu'à l'erreur
- Identifie où les données entrent
- Trace chaque transformation
- Trouve où la corruption/erreur se produit
- Note les validations manquantes

Agent 2 - Dependency Analyzer:
============================
Mission: Analyse les dépendances du code problématique
- Vérifie les versions des packages
- Cherche des breaking changes récents
- Identifie les effets de bord possibles
- Vérifie les singletons/états partagés

Agent 3 - Pattern Matcher:
========================
Mission: Cherche des patterns similaires dans la codebase
- Le même code est-il utilisé ailleurs sans bug?
- Y a-t-il des variations qui fonctionnent?
- Cherche des anti-patterns connus
- Compare avec les best practices

Agent 4 - Git Archaeologist:
==========================
Mission: Fouille l'historique pour comprendre l'évolution
- git log -p sur les fichiers impliqués
- git bisect pour isoler le commit fautif
- Lis les messages de commit pour le contexte
- Identifie qui a touché ce code et pourquoi
```

### 3.2 Analyse du flux d'exécution

Trace l'exécution pas à pas :

```
Entry Point: [fonction/endpoint appelé]
     │
     ▼
Step 1: [Validation input]
     │ Data: {...}
     │ State: OK / PROBLEM?
     ▼
Step 2: [Processing]
     │ Data: {...}
     │ State: OK / PROBLEM?
     ▼
Step 3: [Database/External call]
     │ Data: {...}
     │ State: OK / PROBLEM?
     ▼
Error Point: [Où exactement l'erreur se produit]
     │
     └─→ Root Cause: [...]
```

### 3.3 Valider les hypothèses

Pour chaque hypothèse du Phase 1 :

| Hypothèse | Test | Résultat | Conclusion |
|-----------|------|----------|------------|
| A: [description] | [comment testé] | ✅/❌ | Confirmé/Réfuté |
| B: [description] | [comment testé] | ✅/❌ | Confirmé/Réfuté |
| C: [description] | [comment testé] | ✅/❌ | Confirmé/Réfuté |

### 3.4 Identifier la Root Cause

Utilise la technique des "5 Pourquoi" :

```
Symptôme: [L'erreur observée]
     │
     └─ Pourquoi? [Cause immédiate]
           │
           └─ Pourquoi? [Cause plus profonde]
                 │
                 └─ Pourquoi? [Cause encore plus profonde]
                       │
                       └─ Pourquoi? [Cause système/design]
                             │
                             └─ ROOT CAUSE: [La vraie raison]
```

---

## Output de cette phase

```markdown
## Investigation Report

### Data Flow Analysis
```
[ASCII diagram du flux]
```

### Hypotheses Validation
| Hypothèse | Résultat |
|-----------|----------|
| [...] | [...] |

### Root Cause
**Identified**: [Yes/No]

**Description**:
[Description détaillée de la root cause]

**Evidence**:
- [Preuve 1]
- [Preuve 2]

**5 Whys Analysis**:
1. Why? → [...]
2. Why? → [...]
3. Why? → [...]
4. Why? → [...]
5. ROOT CAUSE → [...]

### Affected Code
| File | Line(s) | Issue |
|------|---------|-------|
| [...] | [...] | [...] |

### Proposed Fix Direction
[Brève description de la direction de la solution]
```

---

→ **Next**: `step-04-fix.md` - Implement precise surgical fix
