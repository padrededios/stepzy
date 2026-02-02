---
name: spec
description: Créer une spécification technique détaillée à partir d'un PRD
argument-hint: "[nom-prd]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
recommended-model: opus
---

# Skill Spec - Spécification Technique

Tu es un architecte logiciel senior. Tu vas créer une spécification technique complète et implémentable à partir d'un PRD existant.

## Arguments

- `$ARGUMENTS` : Nom du PRD (correspond au fichier dans `docs/prd/`)

## Available State

- `{prd_name}` - Nom du PRD
- `{prd_path}` - Chemin vers `docs/prd/$ARGUMENTS.md`
- `{output_path}` - Chemin de sortie `docs/specs/$ARGUMENTS.md`
- `{economy_mode}` - Si true, utilise des appels directs au lieu de subagents
- `{detailed_mode}` - Si true, inclut plus de détails d'implémentation

---

<mandatory_rules>
## RÈGLES D'EXÉCUTION OBLIGATOIRES (LIRE EN PREMIER)

- 📖 READ PRD first - understand requirements before designing
- 🏗️ DESIGN for implementation - spec must be directly usable
- 🔌 API complete - every endpoint fully documented
- 💾 DATA models complete - all fields, relations, indexes
- 🧪 TEST plan included - what to test and how
- 🚫 FORBIDDEN: Creating spec without reading PRD
</mandatory_rules>

---

## Prérequis

Un PRD doit exister dans `docs/prd/$ARGUMENTS.md`. Si le fichier n'existe pas, informe l'utilisateur qu'il doit d'abord exécuter `/prd $ARGUMENTS`.

---

## Workflow

### Phase 1: Analyze → `steps/step-01-analyze.md`

**Role: REQUIREMENTS ANALYST** - Understand the PRD completely

1. Lis et analyse le PRD
2. Extrait les user stories et critères d'acceptation
3. Identifie les contraintes techniques
4. Prépare la liste des composants à spécifier

### Phase 2: Architect → `steps/step-02-architect.md`

**Role: SYSTEM ARCHITECT** - Design the technical solution

1. Crée les diagrammes d'architecture
2. Définit les composants et leurs responsabilités
3. Spécifie les flux de données
4. Identifie les patterns à utiliser

### Phase 3: Detail → `steps/step-03-detail.md`

**Role: API DESIGNER** - Specify APIs, data models, and validations

1. Documente chaque endpoint API
2. Définit les modèles de données (Prisma)
3. Crée les schémas de validation (Zod)
4. Spécifie la gestion des erreurs

### Phase 4: Finalize → `steps/step-04-finalize.md`

**Role: TECHNICAL WRITER** - Complete and document

1. Crée le plan de tests
2. Liste les fichiers à créer/modifier
3. Génère la spec finale
4. Vérifie la cohérence

---

## Quick Start

```bash
# Créer une spec depuis un PRD
/spec notifications-push

# Mode détaillé (plus d'infos d'implémentation)
/spec user-settings --detailed

# Mode économique (pas de subagents)
/spec payments --economy
```

## Output

La spec sera sauvegardée dans `docs/specs/$ARGUMENTS.md` et contiendra :

1. **Overview** - Résumé technique et lien PRD
2. **Architecture** - Diagrammes et composants
3. **API Endpoints** - Documentation complète
4. **Database** - Modèles Prisma
5. **Validation** - Schémas Zod
6. **Error Handling** - Codes et messages
7. **Security** - Auth, authz, validation
8. **Test Plan** - Tests unitaires, intégration, E2E
9. **Files to Create** - Liste exhaustive

## Spec Quality Checklist

Une bonne spec doit :
- [ ] Être directement implémentable
- [ ] Avoir tous les endpoints documentés
- [ ] Inclure les modèles de données complets
- [ ] Spécifier tous les cas d'erreur
- [ ] Avoir un plan de tests clair
- [ ] Être cohérente avec le PRD
