# 🎯 Roadmap : Système de Codes d'Activité

**Branche :** `code_activite`
**Date de début :** 2025-10-22
**Objectif :** Implémenter un système de codes uniques pour rejoindre des activités de manière privée avec filtrage intelligent

---

## 📋 Vue d'ensemble

Les activités affichées dans la page "S'inscrire" ne doivent être que :
- ✅ Les activités auxquelles l'utilisateur est inscrit
- ✅ Les activités que l'utilisateur a créées (pour gestion)

Nouvelle fonctionnalité :
- Vignette "Rejoindre avec un code" dans la page S'inscrire
- Code unique généré automatiquement à la création d'activité
- Affichage du code + lien de partage pour les créateurs

---

## **Phase 1 : Base de données (Backend)** 🗄️

**Durée estimée :** 30 min

### 1.1 Migration Prisma
- [ ] Ajouter le champ `code` au modèle `Activity` (unique, 8 caractères alphanumériques)
- [ ] Créer une migration Prisma
- [ ] Exécuter la migration sur la base de données

**Fichier à modifier :** `packages/backend/prisma/schema.prisma`

```prisma
model Activity {
  // ... champs existants
  code        String   @unique @default(cuid()) // Code unique de 8 caractères
  // ... reste
}
```

### 1.2 Script de génération de codes
- [ ] Créer une fonction utilitaire pour générer des codes uniques courts (ex: `A1B2C3D4`)
- [ ] Fonction de vérification d'unicité du code
- [ ] Script de migration pour ajouter des codes aux activités existantes

**Fichier à créer :** `packages/shared/src/utils/code.ts`

**Critères de validation :**
- ✅ Migration exécutée sans erreur
- ✅ Codes générés pour toutes les activités existantes
- ✅ Codes uniques et de longueur 8

---

## **Phase 2 : Types & Constantes (Shared)** 📦

**Durée estimée :** 15 min

### 2.1 Mise à jour des types
- [ ] Ajouter `code: string` au type `Activity`
- [ ] Créer le type `JoinActivityByCodeData`
- [ ] Créer le type `ActivityCodeResponse`
- [ ] Ajouter des types pour les réponses API

**Fichiers à modifier :**
- `packages/shared/src/types/activity.ts`
- `packages/shared/src/types/index.ts` (exports)

**Nouveaux types :**
```typescript
export interface JoinActivityByCodeData {
  code: string
}

export interface ActivityCodeResponse {
  activity: Activity
  alreadyMember: boolean
}
```

**Critères de validation :**
- ✅ Compilation TypeScript sans erreurs
- ✅ Types exportés correctement

---

## **Phase 3 : Backend API (Backend)** 🔧

**Durée estimée :** 1h30

### 3.1 Service Activity
- [ ] Méthode `generateActivityCode()` - Génération de code unique
- [ ] Méthode `joinActivityByCode(userId, code)` - Rejoindre via code
- [ ] Méthode `getActivityByCode(code)` - Récupérer activité par code
- [ ] Mise à jour de `getAvailableActivities()` pour filtrer selon inscriptions/création

**Fichier à modifier :** `packages/backend/src/services/activity.service.ts`

### 3.2 Routes API
- [ ] `POST /api/activities/join-by-code` - Rejoindre une activité avec un code
- [ ] `GET /api/activities/code/:code` - Récupérer les infos d'une activité par code
- [ ] Mise à jour de `GET /api/activities` pour filtrer correctement

**Fichier à modifier :** `packages/backend/src/routes/activities.routes.ts`

**Critères de validation :**
- ✅ API répond avec les bons codes HTTP (200, 404, 400)
- ✅ Validation des erreurs (code invalide, activité pleine)
- ✅ Filtrage correct des activités (uniquement inscrites/créées)

---

## **Phase 4 : Frontend - Logique & Hooks (Web-App)** ⚛️

**Durée estimée :** 1h

### 4.1 Client API
- [ ] Fonction `joinActivityByCode(code: string)`
- [ ] Fonction `getActivityByCode(code: string)`
- [ ] Fonction `copyCodeToClipboard(code: string)`
- [ ] Fonction `generateShareLink(code: string)`

**Fichier à créer/modifier :** `packages/web-app/src/lib/api/activities.ts`

### 4.2 Hook useActivities
- [ ] Ajouter la méthode `joinByCode(code)`
- [ ] Gérer les erreurs (code invalide, déjà inscrit, etc.)
- [ ] Mise à jour automatique de la liste après inscription
- [ ] Toast de confirmation

**Fichier à modifier :** `packages/web-app/src/hooks/useActivities.ts`

**Critères de validation :**
- ✅ Copie dans le presse-papier fonctionnelle
- ✅ Gestion d'erreurs complète
- ✅ Rafraîchissement automatique de la liste

---

## **Phase 5 : Frontend - Composants UI (Web-App)** 🎨

**Durée estimée :** 2h30

### 5.1 Nouvelle vignette "Rejoindre avec un code"
- [ ] Créer le composant `JoinByCodeCard`
- [ ] Design cohérent avec `CreateActivityCard`
- [ ] Modal/formulaire pour saisir le code
- [ ] Validation du format du code (8 caractères alphanumériques)
- [ ] Affichage des infos de l'activité avant confirmation
- [ ] Gestion des erreurs (code invalide, activité pleine, etc.)
- [ ] Toast de succès/erreur
- [ ] Animation de transition

**Fichier à créer :** `packages/web-app/src/components/activities/JoinByCodeCard.tsx`

**Design de la carte :**
```
┌─────────────────────────────────┐
│ 🔑 Rejoindre avec un code       │
│                                 │
│ Vous avez reçu un code ?        │
│ Entrez-le pour rejoindre        │
│ une activité privée.            │
│                                 │
│ [Entrer un code]                │
└─────────────────────────────────┘
```

### 5.2 Affichage du code pour les créateurs
- [ ] Modifier `ActivityCard` pour afficher le code si `canManage === true`
- [ ] Section dédiée "Partage" dans la carte
- [ ] Bouton "Copier le code" avec feedback visuel (✓ copié)
- [ ] Bouton "Copier le lien d'invitation" avec preview
- [ ] Bouton "Partager par email" avec `mailto:` link pré-rempli
- [ ] Design moderne et intuitif

**Fichier à modifier :** `packages/web-app/src/app/(dashboard)/s-inscrire/page.tsx`

**Design de la section partage :**
```
┌─────────────────────────────────┐
│ 📤 Partager cette activité      │
│                                 │
│ Code : A1B2C3D4 [📋 Copier]     │
│                                 │
│ [🔗 Copier le lien]             │
│ [📧 Partager par email]         │
└─────────────────────────────────┘
```

### 5.3 Mise à jour de la page S'inscrire
- [ ] Ajouter `JoinByCodeCard` dans la grille d'activités
- [ ] Positionner la carte "Rejoindre" à côté de "Créer"
- [ ] S'assurer que le filtrage affiche uniquement les activités pertinentes
- [ ] Gérer les états vides (aucune activité)
- [ ] Responsive design (mobile, tablet, desktop)

**Fichier à modifier :** `packages/web-app/src/app/(dashboard)/s-inscrire/page.tsx`

**Organisation de la grille :**
```
[Activité 1] [Activité 2] [Activité 3]
[Activité 4] [Rejoindre]  [Créer]
```

**Critères de validation :**
- ✅ Design cohérent avec l'existant
- ✅ Responsive sur tous les écrans
- ✅ Animations fluides
- ✅ Accessibilité (WCAG 2.1 AA)

---

## **Phase 6 : Fonctionnalités avancées (Optionnel)** ✨

**Durée estimée :** 1h30

### 6.1 Email d'invitation
- [ ] Template email avec code et informations de l'activité
- [ ] Bouton "Inviter par email" dans la carte d'activité
- [ ] Pré-remplissage du sujet et du corps de l'email
- [ ] Design HTML responsive pour l'email

**Fichiers :**
- `packages/backend/src/services/email.service.ts`
- Template email HTML

**Template email :**
```
Objet: Invitation à rejoindre l'activité [NOM_ACTIVITE]

Bonjour,

[CREATEUR] vous invite à rejoindre l'activité "[NOM_ACTIVITE]" !

Sport : [SPORT]
Jours : [JOURS]
Horaire : [HORAIRE]

Code d'accès : A1B2C3D4

Rejoignez l'activité sur Stepzy !
```

### 6.2 QR Code (bonus)
- [ ] Installer librairie de génération de QR codes (ex: `qrcode`)
- [ ] Générer un QR code encodant le code de l'activité
- [ ] Afficher le QR code dans la carte pour le créateur
- [ ] Bouton "Télécharger le QR code" (PNG)
- [ ] Fonctionnalité de scan (optionnel, nécessite caméra)

**Librairie recommandée :** `qrcode.react` ou `react-qr-code`

**Critères de validation :**
- ✅ Email envoyé avec les bonnes informations
- ✅ QR code scannable et fonctionnel

---

## **Phase 7 : Tests** 🧪

**Durée estimée :** 1h30

### 7.1 Tests Backend
- [ ] Test génération de codes uniques
- [ ] Test API `POST /api/activities/join-by-code` (succès)
- [ ] Test API erreur code invalide
- [ ] Test API erreur activité pleine
- [ ] Test API déjà membre de l'activité
- [ ] Test filtrage activités (ne retourne que inscrites/créées)
- [ ] Test unicité des codes générés

**Fichier à créer/modifier :** `packages/backend/src/__tests__/activity-code.test.ts`

### 7.2 Tests Frontend
- [ ] Test composant `JoinByCodeCard` (render)
- [ ] Test validation du code (format)
- [ ] Test soumission du formulaire
- [ ] Test hook `useActivities.joinByCode()`
- [ ] Test copie dans le presse-papier
- [ ] Test affichage du code pour créateur
- [ ] Test boutons de partage

**Fichiers à créer :**
- `packages/web-app/src/__tests__/components/JoinByCodeCard.test.tsx`
- `packages/web-app/src/__tests__/hooks/useActivities-code.test.ts`

### 7.3 Tests E2E
- [ ] Parcours complet : créer activité → voir code → copier code
- [ ] Parcours : utilisateur 2 → rejoindre avec code → voir activité
- [ ] Test filtrage des activités affichées
- [ ] Test erreurs (code invalide)

**Fichier à créer :** `packages/web-app/src/__tests__/e2e/activity-code.spec.ts`

**Critères de validation :**
- ✅ Couverture des tests > 90%
- ✅ Tous les tests passent
- ✅ Tests E2E couvrent les parcours critiques

---

## **Phase 8 : Documentation & Finalisation** 📚

**Durée estimée :** 30 min

### 8.1 Documentation
- [ ] Mettre à jour `PROGRESS_SUMMARY.md`
- [ ] Documenter l'API dans `API_ROUTES.md`
- [ ] Ajouter des exemples d'utilisation
- [ ] Mettre à jour le README si nécessaire
- [ ] Documenter le format des codes

**Fichiers à modifier :**
- `PROGRESS_SUMMARY.md`
- `packages/backend/API_ROUTES.md`
- `README.md`

### 8.2 Sécurité
- [ ] Rate limiting sur `POST /api/activities/join-by-code` (max 10/min)
- [ ] Validation stricte du format du code (regex)
- [ ] Empêcher la divulgation d'informations sensibles
- [ ] Logs de sécurité pour tentatives multiples avec codes invalides
- [ ] Sanitization des entrées utilisateur

**Regex de validation :** `^[A-Z0-9]{8}$`

### 8.3 Commit & Merge
- [ ] Commit avec message descriptif
- [ ] Push de la branche `code_activite`
- [ ] Créer une Pull Request
- [ ] Review du code
- [ ] Merge vers `architecture`

**Critères de validation :**
- ✅ Documentation complète et à jour
- ✅ Aucune faille de sécurité
- ✅ Code propre et commenté

---

## 📊 Résumé de l'avancement

| Phase | Tâches | Complétées | Progression |
|-------|--------|------------|-------------|
| Phase 1 | 3 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 2 | 4 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 3 | 6 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 4 | 6 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 5 | 11 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 6 | 6 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 7 | 15 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Phase 8 | 8 | 0 | ⬜⬜⬜⬜⬜ 0% |
| **TOTAL** | **59** | **0** | **⬜⬜⬜⬜⬜ 0%** |

---

## 🎯 Estimation de temps

| Phase | Complexité | Temps estimé | Status |
|-------|-----------|--------------|--------|
| Phase 1 | Faible | 30 min | ⏳ À faire |
| Phase 2 | Faible | 15 min | ⏳ À faire |
| Phase 3 | Moyenne | 1h30 | ⏳ À faire |
| Phase 4 | Moyenne | 1h | ⏳ À faire |
| Phase 5 | Élevée | 2h30 | ⏳ À faire |
| Phase 6 | Moyenne | 1h30 | 🎁 Optionnel |
| Phase 7 | Moyenne | 1h30 | ⏳ À faire |
| Phase 8 | Faible | 30 min | ⏳ À faire |
| **Total** | | **~9h** (7h30 sans Phase 6) | |

---

## 🎯 Points d'attention

1. **Unicité des codes** : S'assurer que les codes générés sont uniques et courts (8 caractères)
2. **Sécurité** : Ne pas exposer les activités privées sans code valide
3. **UX** : Feedback immédiat lors de la saisie du code (validation en temps réel)
4. **Migration** : Générer des codes pour les activités existantes sans interruption de service
5. **Filtrage** : Bien tester que seules les bonnes activités s'affichent dans "S'inscrire"
6. **Performance** : Optimiser les requêtes pour éviter N+1 queries
7. **Accessibilité** : Tous les composants doivent être navigables au clavier
8. **Responsive** : Design adaptatif mobile-first

---

## 📝 Notes de développement

### Format du code d'activité
- **Longueur :** 8 caractères
- **Caractères autorisés :** A-Z, 0-9 (majuscules uniquement)
- **Exemple :** `A1B2C3D4`
- **Génération :** Utiliser `nanoid` avec custom alphabet ou fonction custom

### Comportement du filtrage
**Avant (page S'inscrire) :**
- Affichait toutes les activités publiques

**Après :**
- Affiche uniquement les activités où :
  - L'utilisateur est inscrit (`ActivitySubscription` existe)
  - OU l'utilisateur est créateur (`createdBy === userId`)

### Lien de partage
Format : Code uniquement (pas de page dédiée)
```
Exemple d'email :
"Pour rejoindre mon activité, utilise ce code : A1B2C3D4"
```

---

## ✅ Critères de succès

- [ ] Les activités sont créées avec un code unique
- [ ] Les utilisateurs peuvent rejoindre une activité via un code
- [ ] La page "S'inscrire" affiche uniquement les activités pertinentes
- [ ] Les créateurs voient le code et peuvent le partager
- [ ] Tous les tests passent (>90% de couverture)
- [ ] Documentation complète
- [ ] Aucune régression sur les fonctionnalités existantes
- [ ] Performance maintenue (<200ms API)
- [ ] Design cohérent et responsive

---

**Dernière mise à jour :** 2025-10-22
**Maintenu par :** Claude Code
