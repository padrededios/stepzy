# Amélioration de Stepzy - Tickets de développement

## 🔴 Problèmes Critiques

### 1. Page Paramètres manquante (404)
**Priorité**: HAUTE
**Status**: Non commencé
**Description**: Le bouton "Paramètres" dans la navbar navigue vers une page inexistante qui retourne une erreur 404.

**Détails**:
- Bouton "Paramètres" navigue actuellement vers `/messages` (incorrect)
- La page devrait être `/settings` ou `/parametres`
- Les utilisateurs ne peuvent pas accéder à leurs paramètres de profil

**Tâches**:
- [ ] Créer la route `/settings` (page ou modal)
- [ ] Implémenter les paramètres utilisateur (profil, préférences, notifications)
- [ ] Corriger la navigation du bouton "Paramètres"
- [ ] Tester la navigation

**Fichiers concernés**:
- Navigation header component
- Route `/settings`

---

### 2. Avertissements Next.js Image - Propriété "sizes" manquante
**Priorité**: HAUTE
**Status**: Non commencé
**Description**: 7 images utilisent la propriété `fill` sans la propriété `sizes`, ce qui peut impacter les performances.

**Détails**:
Images affectées:
- Logo Stepzy (`/images/stepzy_logo.png`)
- Avatar Player1 (DiceBear API)
- Image Football (`/images/fox_football.jpg`)
- Image Badminton (`/images/fox_badminton.png`)
- Image Volley (`/images/fox_volley.png`)
- Image Ping-Pong (`/images/fox_pingpong.png`)

**Erreur console**:
```
Image with src "..." has "fill" but is missing "sizes" prop.
Please add it to improve page performance.
```

**Solution**:
Ajouter la propriété `sizes` à tous les composants `<Image>` avec `fill`:

```typescript
// Exemple pour une image responsive
<Image
  fill
  src="..."
  alt="..."
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Ou selon le contexte spécifique:
// - Logo header: "(max-width: 640px) 30vw, 50px"
// - Avatar: "32px" (si taille fixe)
// - Images sport: "(max-width: 768px) 100vw, 300px"
```

**Tâches**:
- [ ] Identifier tous les composants Image avec fill
- [ ] Ajouter sizes appropriés pour chaque image
- [ ] Vérifier que les avertissements disparaissent
- [ ] Tester la responsivité

**Fichiers concernés**:
- Components utilisant `<Image fill>`
- Layout header
- Cartes activités

---

### 3. Appels API dupliqués au chargement de page
**Priorité**: MOYENNE
**Status**: Non commencé
**Description**: Plusieurs appels API sont exécutés deux fois lors du chargement d'une page.

**Détails**:
Appels en double identifiés:
- `GET /api/activities/my-created` (x2)
- `GET /api/activities/my-participations` (x2)
- `GET /api/activities/upcoming-sessions` (x2)
- `GET /api/chat/rooms` (x2)
- `GET /api/chat/unread` (x2)
- `GET /api/notifications/count` (x2)

**Causes probables**:
1. Mode strict React en développement (normal mais à optimiser)
2. Dépendances manquantes dans les `useEffect`
3. Hooks query mal configurés

**Tâches**:
- [ ] Vérifier les dépendances des useEffect
- [ ] Vérifier la configuration des queries (React Query/SWR)
- [ ] Optimiser les requêtes pour éviter les doublons
- [ ] Utiliser React DevTools Profiler pour identifier la source
- [ ] Tester que chaque appel API n'est exécuté qu'une fois

**Fichiers concernés**:
- Composants dashboard
- Hooks de données
- Middlewares données

---

## 🟡 Problèmes Non-Critiques

### 4. Page Paramètres inexistante
**Priorité**: MOYENNE
**Status**: Non commencé
**Description**: Ajouter une page de paramètres utilisateur complète.

**Fonctionnalités suggérées**:
- [ ] Gérer le profil (avatar, pseudo, email)
- [ ] Préférences de notifications
- [ ] Paramètres de confidentialité
- [ ] Gérer les activités créées (suppression, modification)
- [ ] Gérer le compte (changement mot de passe, suppression compte)

---

### 5. Onglet "Historique" vide
**Priorité**: BASSE
**Status**: Non commencé
**Description**: L'onglet "Historique (0)" dans "Mes sessions" ne montre aucune donnée.

**Tâches**:
- [ ] Vérifier que les données historiques sont bien stockées
- [ ] Implémenter l'affichage de l'historique des sessions passées
- [ ] Ajouter des filtres/tri sur l'historique

---

## 💡 Améliorations Suggérées

### 6. Ajouter des loaders/skeleton screens
**Priorité**: BASSE
**Status**: Non commencé
**Description**: Afficher un skeleton loading pendant les appels API.

**Tâches**:
- [ ] Implémenter skeleton screens pour les listes activités
- [ ] Afficher loader lors du chargement des statistiques
- [ ] Améliorer l'UX en indiquant que le contenu charge

---

### 7. Pagination pour "Sessions disponibles"
**Priorité**: BASSE
**Status**: Non commencé
**Description**: Implémenter la pagination ou l'infinite scroll pour la liste des sessions disponibles.

**Contexte**: Actuellement 6 sessions, mais avec la croissance de l'app cela sera nécessaire.

**Tâches**:
- [ ] Ajouter pagination au backend
- [ ] Implémenter pagination au frontend
- [ ] Tester avec beaucoup de données

---

### 8. Confirmation avant de quitter une session
**Priorité**: BASSE
**Status**: Non commencé
**Description**: Ajouter une modal de confirmation avant qu'un utilisateur quitte une session.

**Tâches**:
- [ ] Ajouter dialog de confirmation
- [ ] Prévenir les clics accidentels
- [ ] Afficher message de succès après suppression

---

## 📋 Checklist de Test

Après chaque correction, tester:
- [ ] Navigation fonctionne correctement
- [ ] Pas d'erreurs dans la console
- [ ] Responsive design OK (desktop, tablet, mobile)
- [ ] Appels API ne sont pas en double
- [ ] Images s'affichent correctement
- [ ] Performance acceptable

---

## 📊 Résumé des Tests

**Date des tests**: 23 janvier 2026
**Compte utilisé**: player1@test.com
**Pages testées**:
- ✅ Mes sessions
- ✅ Mes activités
- ✅ Mes statistiques
- ✅ Notifications (modal)
- ✅ Messages (modal)
- ❌ Paramètres (404)
- ✅ Responsive mobile

**Problèmes découverts**: 3 critiques, 2 non-critiques, 3 suggestions
**Performance**: Bonne (temps de chargement rapide, pas de bugs visuels)

---

## Notes

- L'application a une excellente base UX
- Le design est cohérent et moderne
- La responsivité est bien implémentée
- Les problèmes détectés sont facilement corrigeables
