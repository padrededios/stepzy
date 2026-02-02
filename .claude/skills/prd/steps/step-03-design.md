---
name: step-03-design
description: Phase de conception - user stories, contraintes et risques
next_step: steps/step-04-document.md
---

# Phase 3: Design

**Role: PRODUCT DESIGNER** - Create detailed user stories and requirements

---

<available_state>
From previous step:
- Problem statement
- User personas
- Success criteria
- Out of scope items
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📝 USER STORIES must be testable - vague = untestable
- ✅ ACCEPTANCE CRITERIA must be binary - pass or fail
- 🔧 TECHNICAL CONSTRAINTS must be realistic
- ⚠️ RISKS must have mitigations
- 🚫 FORBIDDEN: User stories without acceptance criteria
</mandatory_rules>

---

## Actions

### 3.1 Écrire les User Stories

**Format standard :**
```markdown
### US-001: [Titre descriptif]

**En tant que** [type d'utilisateur]
**Je veux** [action/fonctionnalité]
**Afin de** [bénéfice/valeur]

**Priorité**: [P1-Critical / P2-High / P3-Medium / P4-Low]

**Critères d'acceptation**:
- [ ] Étant donné [contexte], quand [action], alors [résultat]
- [ ] Étant donné [contexte], quand [action], alors [résultat]
- [ ] [Critère mesurable]

**Notes**: [Détails additionnels si nécessaire]
```

### 3.2 Exemples de User Stories

```markdown
### US-001: Configurer les préférences de notification

**En tant que** utilisateur connecté
**Je veux** pouvoir configurer mes préférences de notification
**Afin de** recevoir uniquement les notifications pertinentes

**Priorité**: P1-Critical

**Critères d'acceptation**:
- [ ] Je peux accéder aux paramètres depuis mon profil
- [ ] Je peux activer/désactiver chaque type de notification
- [ ] Mes préférences sont sauvegardées immédiatement
- [ ] Je reçois une confirmation visuelle du changement
- [ ] Mes choix sont respectés pour les notifications futures

---

### US-002: Recevoir une notification push

**En tant que** utilisateur avec l'app installée
**Je veux** recevoir des notifications push sur mon appareil
**Afin de** être informé en temps réel des événements importants

**Priorité**: P1-Critical

**Critères d'acceptation**:
- [ ] La notification apparaît même si l'app est fermée
- [ ] Le titre et le message sont visibles
- [ ] Cliquer sur la notification ouvre l'app à la bonne page
- [ ] La notification respecte les paramètres système (DND)
```

### 3.3 Identifier les contraintes techniques

| Catégorie | Contrainte | Impact |
|-----------|------------|--------|
| **Architecture** | [Doit utiliser le service X existant] | [impact sur design] |
| **Performance** | [Temps de réponse < 200ms] | [comment garantir] |
| **Sécurité** | [Données chiffrées, auth requise] | [implications] |
| **Compatibilité** | [Support IE11, iOS 12+] | [limitations] |
| **Dépendances** | [API externe Y] | [risques] |

### 3.4 Analyser les risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| [Risque technique 1] | High/Med/Low | High/Med/Low | [Plan d'action] |
| [Risque business 1] | [prob] | [impact] | [mitigation] |
| [Risque utilisateur 1] | [prob] | [impact] | [mitigation] |

**Exemple de risques :**
- API externe indisponible → Fallback local + retry
- Performances dégradées → Cache + pagination
- Adoption faible → A/B test + onboarding

### 3.5 Définir les dépendances

| Dépendance | Type | Status | Owner |
|------------|------|--------|-------|
| [Service X] | Internal | Ready | Team A |
| [API Y] | External | Pending | - |
| [Design] | Blocker | In progress | Design team |

---

## Output de cette phase

```markdown
## User Stories

### US-001: [Title]
**En tant que** [user]
**Je veux** [action]
**Afin de** [benefit]

**Priorité**: [P1/P2/P3]

**Critères d'acceptation**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### US-002: [Title]
[...]

---

## Technical Constraints

### Architecture
- [Constraint 1]
- [Constraint 2]

### Performance
| Metric | Requirement |
|--------|-------------|
| Response time | < 200ms |
| Throughput | > 100 req/s |

### Security
- [ ] Authentication required
- [ ] Data encrypted at rest
- [ ] Rate limiting: 100 req/min

### Dependencies
| Dependency | Status | Risk |
|------------|--------|------|
| [Dep 1] | Ready | Low |
| [Dep 2] | Pending | Medium |

---

## Risks

| Risk | P | I | Mitigation |
|------|---|---|------------|
| [Risk 1] | M | H | [Plan] |
| [Risk 2] | L | M | [Plan] |
```

---

→ **Next**: `step-04-document.md` - Generate final PRD document
