---
name: step-04-document
description: Phase de documentation - générer le PRD final
next_step: null
---

# Phase 4: Document

**Role: TECHNICAL WRITER** - Generate the final PRD document

---

<available_state>
From previous steps:
- Discovery Report (context, tech stack)
- Problem Definition (users, success criteria)
- User Stories (with acceptance criteria)
- Technical Constraints and Risks
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📄 USE template - consistency matters
- ✅ VERIFY completeness - no empty sections
- 🔗 CROSS-REFERENCE - ensure coherence
- 💾 SAVE correctly - docs/prd/{feature}.md
- 🚫 FORBIDDEN: Incomplete or inconsistent PRD
</mandatory_rules>

---

## Actions

### 4.1 Charger le template

```bash
Read .claude/skills/prd/template.md
```

### 4.2 Assembler le PRD

Remplir chaque section du template avec les informations collectées :

```markdown
# PRD: {Feature Name}

## Metadata
- **Date**: [YYYY-MM-DD]
- **Author**: Claude (AI-assisted)
- **Status**: Draft
- **Version**: 1.0

---

## 1. Executive Summary

[2-3 phrases résumant la feature, le problème qu'elle résout, et sa valeur]

---

## 2. Context and Problem

### 2.1 Problem Description
[Problem statement from Phase 2]

### 2.2 Affected Users
[User table from Phase 2]

### 2.3 Why Now?
[Urgency/importance from Phase 2]

---

## 3. Success Criteria

### 3.1 Key Metrics
[KPI table from Phase 2]

### 3.2 Definition of Done
[Checklist from Phase 2]

---

## 4. User Stories

[All user stories from Phase 3, numbered US-001, US-002, etc.]

---

## 5. Technical Constraints

### 5.1 Architecture
[Architecture constraints from Phase 3]

### 5.2 Performance
[Performance requirements from Phase 3]

### 5.3 Security
[Security requirements from Phase 3]

### 5.4 Dependencies
[Dependency table from Phase 3]

---

## 6. Out of Scope (v1)

[Out of scope items from Phase 2]

---

## 7. Risks and Mitigations

[Risk table from Phase 3]

---

## 8. Timeline (Suggested)

| Phase | Description | Estimate |
|-------|-------------|----------|
| Phase 1 | [Description] | [X days/weeks] |
| Phase 2 | [Description] | [X days/weeks] |
| Phase 3 | [Description] | [X days/weeks] |

---

## 9. Appendix

### 9.1 References
- [Related PRD/Spec links]
- [External documentation]

### 9.2 Glossary
| Term | Definition |
|------|------------|
| [Term] | [Definition] |
```

### 4.3 Vérifier la cohérence

Checklist de vérification :
- [ ] Toutes les sections remplies
- [ ] User stories ont des critères d'acceptation
- [ ] KPIs sont mesurables
- [ ] Out of scope est défini
- [ ] Risques ont des mitigations
- [ ] Pas de contradictions

### 4.4 Sauvegarder le PRD

```bash
# Créer le dossier si nécessaire
mkdir -p docs/prd

# Sauvegarder le PRD
Write docs/prd/{feature_name}.md
```

---

## Final Report

```markdown
## 📋 PRD Generation Complete

### Document
- **Path**: `docs/prd/{feature_name}.md`
- **Status**: ✅ Created

### Content Summary
- User Stories: [X]
- Acceptance Criteria: [X] total
- Risks Identified: [X]
- Dependencies: [X]

### Quality Check
- [x] Problem clearly defined
- [x] Success criteria measurable
- [x] User stories testable
- [x] Scope defined (in and out)
- [x] Risks documented

### Next Steps
1. Review with stakeholders
2. Run `/spec {feature_name}` to create technical specification
3. Run `/dev {feature_name}` after spec is approved

### Commands
```bash
# View the PRD
cat docs/prd/{feature_name}.md

# Create technical spec from this PRD
/spec {feature_name}
```
```

---

## 🎉 PRD Complete

Le PRD a été créé avec succès :
- ✅ Problème défini
- ✅ Users identifiés
- ✅ Success criteria mesurables
- ✅ User stories complètes
- ✅ Risques documentés

→ **Session terminée**

Prochaine étape : `/spec {feature_name}` pour créer la spécification technique.
