# 🥅 Plan de Travail - SaaS Réservation Futsal

## 📋 Vue d'ensemble
Application Next.js (App Router) avec Better-auth et PostgreSQL pour la réservation de matchs de futsal entre midi et deux, développée en TDD.

---

## 🏗️ Phase 1 : Configuration & Infrastructure

### 1.1 Setup Initial
- ✅ Initialiser le projet Next.js avec TypeScript
- ✅ Configurer Tailwind CSS
- ✅ Setup ESLint et Prettier
- ✅ Configurer Jest et Testing Library pour les tests
- ✅ Setup Playwright pour les tests E2E
- ✅ Configurer Docker pour PostgreSQL (dev)

### 1.2 Base de Données
- ✅ Setup Prisma avec PostgreSQL
- ✅ Écrire les tests pour les modèles de données
- ✅ Créer le schéma Prisma (User, Match, MatchPlayer)
- ✅ Configurer les migrations Prisma
- ✅ Seed initial avec utilisateur root
- ✅ Tests d'intégration base de données

### 1.3 Configuration Better-Auth
- ✅ Tests unitaires pour la configuration auth
- ✅ Installation et configuration Better-auth
- ✅ Configuration des providers (email/password)
- ✅ Setup des sessions et cookies
- ✅ Tests d'intégration authentification

---

## 🔐 Phase 2 : Authentification

### 2.1 Tests d'Authentification
- ✅ Tests unitaires pour les utilitaires auth
- ✅ Tests d'intégration API auth
- ✅ Tests E2E des flows auth complets

### 2.2 API Routes Auth
- ✅ Route `/api/auth/register` avec validation
- ✅ Route `/api/auth/login` avec gestion d'erreurs
- ✅ Route `/api/auth/logout`
- ✅ Middleware de protection des routes
- ✅ Gestion des rôles (user/root)

### 2.3 Pages Authentification
- ✅ Tests pour composants Login/Register
- ✅ Page `/login` avec formulaire et validation
- ✅ Page `/register` avec upload avatar
- ✅ Gestion des erreurs et loading states
- ✅ Redirections après connexion/inscription

---

## 🏠 Phase 3 : Interface Utilisateur Core

### 3.1 Layout & Navigation
- ✅ Tests pour composants layout
- ✅ Header avec navigation utilisateur
- ✅ Sidebar responsive
- ✅ Footer
- ✅ Protection des routes privées

### 3.2 Page d'Accueil
- ✅ Tests composants d'affichage des matchs
- ✅ Composant MatchCard avec informations
- ✅ Affichage semaine courante + suivante
- ✅ Boutons inscription/désinscription
- ✅ États de chargement et erreurs

### 3.3 Composants Réutilisables
- ✅ Tests unitaires pour tous les composants
- ✅ Composant Avatar avec fallback
- ✅ Boutons d'action (inscription/désinscription)
- [ ] Modales de confirmation
- [ ] Notifications toast

---

## 📊 Phase 4 : Gestion des Matchs (API) ✅

### 4.1 Tests API Matchs
- ✅ Tests unitaires pour la logique métier (17/17 tests passent)
- ✅ Tests d'intégration API complète (23 tests créés)
- ✅ Tests de la gestion liste d'attente
- ✅ Tests de validation des contraintes temporelles (12h-14h, jours ouvrés)

### 4.2 CRUD Matchs
- ✅ `GET /api/matches` - Liste des matchs (existait déjà)
- ✅ `POST /api/matches` - Création (root seulement)
- ✅ `GET /api/matches/[id]` - Détails d'un match
- ✅ `PUT /api/matches/[id]` - Modification (root)
- ✅ `DELETE /api/matches/[id]` - Suppression (root)

### 4.3 Gestion Inscriptions
- ✅ `POST /api/matches/[id]/join` - S'inscrire (existait déjà)
- ✅ `DELETE /api/matches/[id]/leave` - Se désinscrire (existait déjà)
- ✅ Logique automatique liste d'attente
- ✅ Promotion automatique depuis liste d'attente
- ✅ Validation limite 12 joueurs (maintenant configurable)

### 4.4 Actions Admin
- ✅ `POST /api/matches/[id]/force-join` - Inscrire un joueur
- ✅ `POST /api/matches/[id]/force-leave` - Désinscrire un joueur  
- ✅ `POST /api/matches/[id]/replace` - Remplacer un joueur

---

## ⚽ Phase 5 : Vue Détaillée Match (Style MPG) ✅

### 5.1 Tests Interface Match
- ✅ Tests unitaires composant MatchView (20/20 tests passent)
- ✅ Tests interaction utilisateur (clic avatar, permissions)
- ✅ Tests affichage responsive (mobile/desktop)

### 5.2 Composant MatchView
- ✅ Layout équipes (6v6) avec avatars et terrain de foot
- ✅ Affichage joueurs titulaires avec distribution automatique
- ✅ Section liste d'attente (style banc) avec positions
- ✅ Interaction désinscription via clic avatar
- ✅ Gestion états vide/complet/annulé

### 5.3 Interactions Utilisateur
- ✅ Clic sur avatar pour se désinscrire (propre avatar seulement)
- ✅ Popover de confirmation de désinscription
- ✅ Mise à jour temps réel après actions via onMatchUpdate
- ✅ Gestion des permissions (utilisateur vs admin)
- ✅ Page détaillée `/matches/[id]` avec navigation

---

## ✅ Phase 6 : Panel Administration

### 6.1 Tests Panel Admin
- ✅ Tests unitaires composants admin (42 tests)
- ✅ Tests protection routes admin
- ✅ Tests actions administratives

### 6.2 Gestion Utilisateurs
- ✅ Page liste des utilisateurs (`/admin/users`)
- ✅ Recherche et filtres utilisateurs
- ✅ Actions : réinitialiser mot de passe
- ✅ Actions : supprimer utilisateur
- ✅ Actions : modifier pseudo/avatar

### 6.3 Gestion Statistics Admin
- ✅ Dashboard statistiques temps réel (`/admin/statistics`)
- ✅ Graphiques et métriques d'utilisation
- ✅ Export CSV/PDF des données
- ✅ Activité récente utilisateurs

### 6.4 API Administration
- ✅ `GET /api/admin/users` - Liste utilisateurs avec pagination
- ✅ `POST /api/admin/users/[id]/reset-password` - Réinitialisation
- ✅ `DELETE /api/admin/users/[id]` - Suppression utilisateur  
- ✅ `PUT /api/admin/users/[id]` - Modifier profil
- ✅ `GET /api/admin/statistics` - Statistiques globales
- ✅ Routes avec protection rôle root

---

## 🔔 Phase 7 : Système de Notifications

### 7.1 Tests Notifications
- [ ] Tests unitaires service notifications
- [ ] Tests envoi notifications automatiques
- [ ] Tests interfaces notifications

### 7.2 Service Notifications
- [ ] Service email basique (dev)
- [ ] Notifications in-app
- [ ] Template promotion liste d'attente
- [ ] Queue de notifications

### 7.3 Interface Notifications
- [ ] Centre de notifications utilisateur
- [ ] Marquer comme lu/non lu
- [ ] Historique des notifications

---

## 🚀 Phase 8 : Optimisations & Production

### 8.1 Performance
- [ ] Tests de performance API
- [ ] Optimisation requêtes base de données
- [ ] Mise en cache des données statiques
- [ ] Images optimisées (avatars)

### 8.2 Sécurité
- [ ] Tests sécurité (injections, XSS)
- [ ] Validation stricte des inputs
- [ ] Rate limiting des API
- [ ] Audit sécurité dépendances

### 8.3 Monitoring & Logs
- [ ] Setup logging structuré
- [ ] Métriques application
- [ ] Health checks
- [ ] Error tracking

### 8.4 Déploiement
- [ ] Configuration environnements
- [ ] Docker production
- [ ] CI/CD avec tests
- [ ] Documentation déploiement

---

## 🧪 Phase 9 : Tests & QA

### 9.1 Coverage & Qualité
- [ ] Atteindre 90%+ de couverture tests
- [ ] Tests E2E complets (scenarios utilisateur)
- [ ] Tests de régression
- [ ] Tests de charge basiques

### 9.2 UX & Accessibilité
- [ ] Tests accessibilité (a11y)
- [ ] Tests responsive design
- [ ] Tests navigation clavier
- [ ] Validation UX avec utilisateurs

---

## 📚 Phase 10 : Documentation & Finition

### 10.1 Documentation Technique
- [ ] Documentation API (OpenAPI/Swagger)
- [ ] README complet avec setup
- [ ] Guide de contribution
- [ ] Architecture decision records

### 10.2 Documentation Utilisateur
- [ ] Guide utilisateur final
- [ ] Guide administrateur
- [ ] FAQ commune
- [ ] Support technique

---

## 📊 Métriques de Succès

- ✅ Tous les tests passent (unitaires, intégration, E2E)
- ✅ Couverture de code > 90%
- ✅ Temps de réponse API < 200ms
- ✅ Interface responsive sur tous devices
- ✅ Accessibilité WCAG 2.1 AA
- ✅ Zero faille de sécurité critique
- ✅ Documentation complète et à jour

---

## 🛠️ Stack Technique Finale

- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Styling** : Tailwind CSS + Headless UI
- **Auth** : Better-auth
- **Database** : PostgreSQL + Prisma ORM
- **Testing** : Jest + Testing Library + Playwright
- **Deployment** : Docker + Vercel/Railway
- **Monitoring** : Sentry + Analytics

---

*Ce plan suit une approche TDD stricte : chaque fonctionnalité commence par l'écriture des tests, puis l'implémentation, puis la validation.*