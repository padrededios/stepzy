# 🏅 Plan de Travail - Stepzy Plateforme Multisports

## 📋 Vue d'ensemble
Plateforme Next.js (App Router) avec Better-auth et PostgreSQL pour la réservation d'activités sportives multiples, développée en TDD.

## 🎉 Version Actuelle : 3.2.0 (Janvier 2025)

### ✅ Améliorations Récentes v3.2
- **Optimisation Performance** : Mise à jour optimiste des états au lieu de rechargement complet des données
- **Navigation Améliorée** : Formulaire de création intégré comme onglet dans "Mes activités"
- **Interface Épurée** : Suppression des headers redondants sur toutes les pages
- **Positionnement Intelligent** : Onglet "Créer une activité" positionné à droite avec icône
- **États Vides Améliorés** : Messages contextuels pour sections sans contenu

### ✅ Améliorations v3.1
- **Layout Persistant** : Implémentation de Next.js Layout Groups `(dashboard)` pour éviter les re-renders
- **Context API** : Hook `useCurrentUser()` pour accès utilisateur sans props drilling
- **Toast Notifications** : Système moderne avec design élégant (dégradés, animations)
- **UX Améliorée** : Suppression des badges redondants, notifications toast au lieu de messages inline
- **Architecture Optimisée** : Simplification de toutes les pages avec pattern unifié

### 🚀 Fonctionnalités Complètes
- ✅ **Activités Récurrentes** : Système complet de création et gestion
- ✅ **Subscriptions** : Inscription aux activités et sessions
- ✅ **Multi-Sports** : Football, Badminton, Volleyball, Ping-Pong, Rugby
- ✅ **Gestion Temporelle** : Fermeture automatique, archivage intelligent
- ✅ **Administration** : Panel complet avec statistiques, gestion utilisateurs
- ✅ **Tests** : Couverture > 95% (134+ tests)

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
- ✅ Composant Toast moderne avec animations
- ✅ Layout persistant avec Context API
- [ ] Modales de confirmation

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

## 🔔 Phase 7 : Système de Notifications ✅

### 7.1 Tests Notifications
- ✅ Tests unitaires service notifications
- ✅ Tests envoi notifications automatiques
- ✅ Tests interfaces notifications

### 7.2 Service Notifications
- ✅ Service email basique (dev) avec templates HTML/text
- ✅ Notifications in-app avec système de centre de notifications
- ✅ Templates promotion liste d'attente et rappels activités
- ✅ Push notifications avec service worker
- ✅ Service de nettoyage automatique des notifications

### 7.3 Interface Notifications
- ✅ Centre de notifications utilisateur (`/notifications`)
- ✅ Marquer comme lu/non lu (individuel et global)
- ✅ Historique des notifications avec pagination
- ✅ Badge de notifications non lues dans le header
- ✅ Intégration avec les activités (liens vers matchs)

---

## 🚀 Phase 8 : Optimisations & Production

### 8.1 Performance
- ✅ Tests de performance API (load testing configuré)
- ✅ Optimisation requêtes base de données (avec Prisma optimisé)
- ✅ Mise en cache des données statiques
- ✅ Images optimisées (avatars) avec Next.js Image

### 8.2 Sécurité
- ✅ Tests sécurité (injections, XSS) avec validation Zod
- ✅ Validation stricte des inputs sur toutes les APIs
- ✅ Sandbox mode pour sécuriser les opérations
- ✅ Gestion sécurisée des secrets et clés API

### 8.3 Monitoring & Logs
- ✅ Setup logging structuré avec Winston
- ✅ Métriques application et monitoring
- ✅ Health checks API (`/api/health`)
- ✅ Error tracking et gestion centralisée

### 8.4 Déploiement
- ✅ Configuration environnements (dev/prod)
- ✅ Docker production (PostgreSQL + Redis)
- [ ] CI/CD avec tests
- [ ] Documentation déploiement

---

## 🧪 Phase 9 : Tests & QA ✅

### 9.1 Coverage & Qualité
- ✅ Atteindre 90%+ de couverture tests (unitaires + intégration)
- ✅ Tests E2E complets (scenarios utilisateur) avec Playwright
- ✅ Tests de régression automatisés
- ✅ Tests de charge basiques avec performance monitoring

### 9.2 UX & Accessibilité
- ✅ Tests accessibilité (a11y) configurés
- ✅ Tests responsive design (mobile/tablet/desktop)
- ✅ Tests navigation clavier et screen readers
- ✅ Interface moderne "page-in-page" avec DashboardLayout cohérent

---

## 🏅 Phase 10 : Évolution Multisports (Version 2.0)

### 10.1 Modèle de données multisports
- ✅ Ajout du champ `sport` au modèle Match
- ✅ Création de l'enum SportType (football, badminton, volley, pingpong, rugby)
- ✅ Configuration spécifique par sport (min/max joueurs)
- ✅ Migration de la base de données

### 10.2 Interface utilisateur
- ✅ Sélection visuelle du sport avec icônes
- ✅ Adaptation automatique du nombre de joueurs
- ✅ Mise à jour du branding (Stepzy)
- ✅ Affichage des sports dans les cartes d'activité

### 10.3 APIs et backend
- ✅ Support multisports dans les APIs
- ✅ Mise à jour des notifications (emails, push)
- ✅ Adaptation des données de seed
- ✅ Configuration des sports centralisée

### 10.4 Documentation
- ✅ Mise à jour complète de la documentation
- ✅ Guides utilisateur multisports
- ✅ Spécifications techniques mises à jour

---

## 📚 Phase 11 : Code Quality & Finition ✅

### 11.1 Refactoring & Architecture
- ✅ Centralisation des types TypeScript (`/src/types/`)
- ✅ Consolidation des fonctions utilitaires (`/src/lib/utils/`)
- ✅ Suppression du code mort et console.log
- ✅ Optimisation des imports (absolus vs relatifs)
- ✅ Architecture API client centralisée
- ✅ Nettoyage complet du codebase (88 fichiers optimisés)

### 11.2 Interface Utilisateur
- ✅ Correction positionnement menu utilisateur (dropdown)
- ✅ DashboardLayout unifié sur toutes les pages
- ✅ Navigation cohérente avec sidebar moderne
- ✅ Gestion automatique des activités expirées
- ✅ Fermeture inscriptions 15min avant activités

### 11.3 Documentation Technique
- ✅ Documentation API avec types TypeScript stricts
- ✅ README complet avec setup Docker
- ✅ Spécifications techniques détaillées
- ✅ Architecture modulaire documentée

### 11.4 Système de Gestion
- ✅ Nettoyage automatique des activités terminées
- ✅ API de maintenance (`/api/cleanup`)
- ✅ Gestion des activités récurrentes
- ✅ Contraintes temporelles intelligentes

---

## 🏅 Phase 12 : Activités Récurrentes Utilisateur (v3.0) ✅

### 12.1 Architecture de Base de Données ✅
- ✅ Nouveau modèle Activity (activité parente) avec récurrence
- ✅ Modèle ActivitySession (sessions individuelles d'une activité)
- ✅ Modèle ActivityParticipant (participation aux sessions)
- ✅ Modèle ActivitySubscription (abonnements persistants aux activités)
- ✅ Enums RecurringType, SessionStatus, ParticipantStatus
- ✅ Relations complètes avec User et gestion des cascades
- ✅ Migration 20250930115816 pour table activity_subscriptions

### 12.2 Services Backend ✅
- ✅ ActivitySessionService pour génération automatique des sessions
- ✅ Support récurrence hebdomadaire et mensuelle
- ✅ Génération sessions 2 semaines à l'avance (fenêtre glissante)
- ✅ ActivityParticipationService pour inscriptions/désinscriptions
- ✅ Gestion automatique liste d'attente avec promotion
- ✅ Nettoyage automatique sessions expirées
- ✅ Filtrage intelligent sessions (visible même après inscription)

### 12.3 APIs Complètes ✅
- ✅ POST /api/activities - Création d'activité (tout utilisateur)
- ✅ GET /api/activities - Liste avec statut subscription utilisateur
- ✅ GET /api/activities/my-created - Activités créées par l'utilisateur
- ✅ GET /api/activities/my-participations - Participations utilisateur
- ✅ GET /api/activities/upcoming-sessions - Sessions disponibles (2 semaines)
- ✅ POST/DELETE /api/activities/[activityId]/subscribe - S'abonner/désabonner activité
- ✅ POST/DELETE /api/activities/sessions/[sessionId]/join - Rejoindre/quitter session
- ✅ GET/PUT/DELETE /api/activities/[activityId]/sessions/[sessionId] - Gestion sessions créateur
- ✅ POST /api/activities/generate-sessions - Cron job génération automatique
- ✅ Fix params dynamiques Next.js 15 (Promise<{ id: string }>)

### 12.4 Types TypeScript ✅
- ✅ Types Activity, ActivitySession, ActivityParticipant complets
- ✅ Types pour formulaires (CreateActivityData, UpdateSessionData)
- ✅ Types pour vues enrichies (ActivityWithStats, SessionWithParticipants)
- ✅ Configuration jours semaine et labels français
- ✅ Integration complète avec types existants

### 12.5 Tests Complets ✅
- ✅ Tests unitaires ActivitySessionService (génération récurrence)
- ✅ Tests unitaires ActivityParticipationService (inscriptions/liste d'attente)
- ✅ Tests d'intégration APIs activités (création, récupération, filtres)
- ✅ Tests d'intégration APIs participation (rejoindre/quitter sessions)
- ✅ Couverture complète logique métier et cas d'erreur

### 12.6 Fonctionnalités Clés ✅
- ✅ **Démocratisation** : Tout utilisateur peut créer des activités récurrentes
- ✅ **Récurrence intelligente** : Support hebdomadaire/mensuelle avec jours personnalisables
- ✅ **Gestion fine** : Créateurs peuvent modifier/annuler sessions individuelles
- ✅ **Vue 2 semaines** : Sessions générées automatiquement en continu
- ✅ **Système d'intérêt** : Statuts interested/confirmed/waiting avec promotion automatique
- ✅ **Notifications** : Infrastructure prête pour notifications promotions/annulations
- ✅ **Abonnements persistants** : Système d'inscription aux activités avec tracking BDD
- ✅ **UI temps réel** : Mise à jour immédiate boutons inscription/désinscription
- ✅ **Gestion sessions** : Sessions restent visibles après inscription avec bouton état dynamique

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