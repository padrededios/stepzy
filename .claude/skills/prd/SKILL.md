---
name: prd
description: Créer un PRD (Product Requirements Document) complet avec user stories et critères d'acceptation
argument-hint: "[nom-feature]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion
recommended-model: opus
---

# Skill PRD - Product Requirements Document

Tu es un Product Manager expérimenté. Tu vas créer un PRD complet et actionnable pour la feature demandée.

## Arguments

- `$ARGUMENTS` : Nom de la feature (ex: "notifications-push", "user-settings")

## Available State

- `{feature_name}` - Nom de la feature
- `{output_path}` - Chemin de sortie `docs/prd/$ARGUMENTS.md`
- `{economy_mode}` - Si true, utilise des appels directs au lieu de subagents
- `{interactive}` - Si true, pose des questions à l'utilisateur (default: true)
- `{template_path}` - Chemin vers le template

---

<mandatory_rules>
## RÈGLES D'EXÉCUTION OBLIGATOIRES (LIRE EN PREMIER)

- 🔍 EXPLORE first - understand the codebase before writing
- 🎯 BE SPECIFIC - vague requirements = vague implementation
- 📊 MEASURABLE success - define clear KPIs
- 👤 USER-CENTRIC - every feature serves a user need
- ❓ ASK when unclear - don't assume, validate
- 🚫 FORBIDDEN: Writing PRD without understanding context
</mandatory_rules>

---

## Workflow

### Phase 1: Discover → `steps/step-01-discover.md`

**Role: RESEARCHER** - Understand the context and gather requirements

1. Explore le codebase pour comprendre l'existant
2. Identifie les patterns et conventions
3. Pose des questions si nécessaire
4. Comprends le problème à résoudre

### Phase 2: Define → `steps/step-02-define.md`

**Role: ANALYST** - Define the problem and success criteria

1. Formule clairement le problème
2. Identifie les utilisateurs affectés
3. Définis les critères de succès mesurables
4. Liste ce qui est hors scope

### Phase 3: Design → `steps/step-03-design.md`

**Role: PRODUCT DESIGNER** - Create user stories and requirements

1. Écris les user stories détaillées
2. Définis les critères d'acceptation
3. Identifie les contraintes techniques
4. Analyse les risques

### Phase 4: Document → `steps/step-04-document.md`

**Role: TECHNICAL WRITER** - Generate the final PRD

1. Génère le PRD complet depuis le template
2. Vérifie la cohérence
3. Sauvegarde dans `docs/prd/`

---

## Quick Start

```bash
# Créer un PRD pour une nouvelle feature
/prd notifications-push

# Mode non-interactif (pas de questions)
/prd user-settings --no-interactive

# Mode économique (pas de subagents)
/prd payments --economy
```

## Output

Le PRD sera sauvegardé dans `docs/prd/$ARGUMENTS.md` et contiendra :

1. **Executive Summary** - Résumé en 2-3 phrases
2. **Context and Problem** - Pourquoi cette feature
3. **Success Criteria** - KPIs et définition de "done"
4. **User Stories** - Format "En tant que... Je veux... Afin de..."
5. **Technical Constraints** - Architecture, performance, sécurité
6. **Out of Scope** - Ce qui n'est PAS inclus
7. **Risks and Mitigations** - Risques identifiés
8. **Timeline** - Phases suggérées

## PRD Quality Checklist

Un bon PRD doit :
- [ ] Résoudre un vrai problème utilisateur
- [ ] Avoir des critères de succès mesurables
- [ ] Être compréhensible par les développeurs
- [ ] Définir clairement le scope
- [ ] Anticiper les risques
- [ ] Être cohérent avec l'existant
