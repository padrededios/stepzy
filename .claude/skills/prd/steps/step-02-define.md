---
name: step-02-define
description: Phase de définition - problème, utilisateurs et critères de succès
next_step: steps/step-03-design.md
---

# Phase 2: Define

**Role: ANALYST** - Define the problem clearly and set success criteria

---

<available_state>
From previous step:
- Discovery Report with tech context
- Related features identified
- User inputs (if interactive)
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🎯 BE SPECIFIC - "améliorer l'UX" n'est pas un problème
- 📊 MEASURABLE outcomes - si ça ne se mesure pas, ça n'existe pas
- 👤 USER focus - chaque problème affecte quelqu'un
- 🚧 SCOPE clearly - définir ce qui est OUT est aussi important
- 🚫 FORBIDDEN: Vague problem statements
</mandatory_rules>

---

## Actions

### 2.1 Formuler le problème

**Template de problem statement :**
```
[Type d'utilisateur] a du mal à [action/objectif]
parce que [raison/obstacle actuel].
Cela cause [impact négatif mesurable].
```

**Exemple :**
```
Les utilisateurs premium ont du mal à gérer leurs notifications
parce qu'il n'existe pas d'interface de configuration.
Cela cause un taux de désabonnement de 15% pour "trop de notifications".
```

### 2.2 Identifier les utilisateurs

| Type d'utilisateur | Description | Fréquence d'usage | Impact |
|-------------------|-------------|-------------------|--------|
| [Persona 1] | [Description] | [quotidien/hebdo/etc.] | [High/Med/Low] |
| [Persona 2] | [Description] | [fréquence] | [impact] |

### 2.3 Définir les critères de succès

**KPIs mesurables :**

| Métrique | Actuel | Cible | Méthode de mesure |
|----------|--------|-------|-------------------|
| [Métrique 1] | [valeur] | [cible] | [comment mesurer] |
| [Métrique 2] | [valeur] | [cible] | [comment mesurer] |

**Exemples de bonnes métriques :**
- Taux de conversion : +10%
- Temps de réalisation : -30%
- Taux d'erreur : <5%
- NPS : +15 points

### 2.4 Définition de "Done"

La feature est terminée quand :
- [ ] [Critère objectif 1]
- [ ] [Critère objectif 2]
- [ ] [Critère objectif 3]
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Déployé en production

### 2.5 Définir le hors scope (Out of Scope)

**Important : Lister explicitement ce qui N'EST PAS inclus**

| Feature/Aspect | Raison de l'exclusion | Version future? |
|----------------|----------------------|-----------------|
| [Élément 1] | [pourquoi pas maintenant] | v2/jamais |
| [Élément 2] | [raison] | [quand] |

---

## Output de cette phase

```markdown
## Problem Definition

### Problem Statement
[Type d'utilisateur] a du mal à [action]
parce que [raison].
Cela cause [impact négatif].

### Affected Users
| Persona | Impact | Priority |
|---------|--------|----------|
| [Persona 1] | High | P1 |
| [Persona 2] | Medium | P2 |

### Why Now?
[Pourquoi cette feature est importante maintenant]

### Success Criteria

#### KPIs
| Metric | Current | Target |
|--------|---------|--------|
| [Metric 1] | [X] | [Y] |
| [Metric 2] | [X] | [Y] |

#### Definition of Done
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Out of Scope (v1)
- [Excluded item 1] - Reason: [why]
- [Excluded item 2] - Reason: [why]
- [Excluded item 3] - For v2

### Assumptions
- [Assumption 1]
- [Assumption 2]
```

---

→ **Next**: `step-03-design.md` - Create user stories and requirements
