# 🛡️ Guide Administrateur - Futsal Reservation SaaS

Guide complet pour administrer l'application de réservation de matchs de futsal. Ce document couvre toutes les fonctionnalités d'administration et les meilleures pratiques.

## 📋 Table des matières

- [Accès administrateur](#-accès-administrateur)
- [Dashboard admin](#-dashboard-admin)
- [Gestion des utilisateurs](#-gestion-des-utilisateurs)
- [Gestion des matchs](#-gestion-des-matchs)
- [Système de notifications](#-système-de-notifications)
- [Statistiques et reporting](#-statistiques-et-reporting)
- [Monitoring système](#-monitoring-système)
- [Maintenance](#-maintenance)
- [Sécurité](#-sécurité)
- [Dépannage](#-dépannage)

## 🔐 Accès administrateur

### Compte root par défaut

Lors du premier déploiement, un compte administrateur est créé :
```
Email : root@futsal.com
Mot de passe : RootPass123!
```

> ⚠️ **Sécurité** : Changez immédiatement le mot de passe après la première connexion !

### Navigation administrateur

Une fois connecté en tant qu'admin, vous avez accès à :
- **Menu utilisateur étendu** avec options admin
- **Sidebar admin** : Sections dédiées à l'administration
- **Permissions étendues** : Modification de tous les matchs et utilisateurs

### Hiérarchie des rôles

- **`root`** : Administrateur principal (toutes permissions)
- **`user`** : Utilisateur standard (accès limité)

> 💡 Actuellement, seul le rôle `root` existe. D'autres rôles admin peuvent être ajoutés dans le futur.

## 📊 Dashboard admin

Accès via `/admin` ou le menu latéral admin.

### Vue d'ensemble système
```
📈 Statistiques temps réel
┌─────────────────────────────────┐
│ 👥 Utilisateurs actifs: 127     │
│ ⚽ Matchs ce mois: 24          │  
│ 🔔 Notifications envoyées: 340 │
│ 📊 Taux d'occupation: 87%      │
└─────────────────────────────────┘
```

### Métriques importantes

#### Performance application
- **Temps de réponse API** : <200ms (seuil alerte)
- **Temps chargement pages** : <3s (objectif)
- **Taux d'erreur** : <1% (acceptable)
- **Disponibilité** : >99.5% (SLA)

#### Utilisation
- **Utilisateurs actifs** : Connexions 30 derniers jours
- **Taux occupation matchs** : Pourcentage places prises
- **Pics d'activité** : Heures de forte utilisation
- **Géolocalisation** : Répartition géographique utilisateurs

## 👥 Gestion des utilisateurs

Accès via `/admin/users`.

### Interface de gestion

```
🔍 Recherche et filtres
┌─────────────────────────────────────────────┐
│ Recherche: [________] 🔍                    │
│ Filtres: [Tous ▼] [Actifs ▼] [Date ▼]     │
└─────────────────────────────────────────────┘

📋 Liste des utilisateurs
┌──────────────────────────────────────────────────────┐
│ 👤 Alice Martin (alice@example.com)                 │
│ 🟢 Actif | ⚽ 12 matchs | 📅 Inscrit le 15/01/2024  │
│ [Voir] [Modifier] [Réinitialiser MdP] [Supprimer]   │
├──────────────────────────────────────────────────────┤
│ 👤 Bob Dupont (bob@example.com)                     │
│ 🟡 Inactif | ⚽ 3 matchs | 📅 Inscrit le 22/01/2024 │
│ [Voir] [Modifier] [Réinitialiser MdP] [Activer]     │
└──────────────────────────────────────────────────────┘
```

### Actions disponibles

#### Consultation utilisateur
- **Profil complet** : Toutes informations personnelles
- **Historique matchs** : Liste chronologique participations
- **Statistiques détaillées** : Taux présence, badges, activité
- **Sessions actives** : Connexions en cours
- **Logs d'activité** : Actions récentes

#### Modification utilisateur
- **Informations personnelles** : Email, pseudo, avatar
- **Rôle** : Promotion/rétrogradation admin
- **Statut** : Activation/désactivation compte
- **Préférences** : Notifications, paramètres

#### Actions sécurité
- **Réinitialisation mot de passe** : Génère nouveau mot de passe temporaire
- **Invalidation sessions** : Force déconnexion immédiate
- **Historique connexions** : IP, navigateur, géolocalisation
- **Détection anomalies** : Tentatives suspectes

### Recherche et filtres avancés

#### Recherche textuelle
```typescript
// Recherche sur multiple champs
- Email (exact ou partiel)
- Pseudo (insensible à la casse)  
- Nom complet (si fourni)
```

#### Filtres disponibles
- **Statut** : Actif, Inactif, Suspendu
- **Rôle** : User, Root
- **Activité** : Dernière connexion (24h, 7j, 30j)
- **Inscription** : Date création compte
- **Participation** : Nombre matchs joués
- **Localisation** : Pays, ville (si disponible)

#### Export données
```bash
# Formats supportés
- CSV : Tableur compatible
- JSON : API/intégration  
- PDF : Rapport formaté
```

### Gestion en masse

#### Sélection multiple
- **Cocher utilisateurs** pour actions groupées
- **Sélection page** ou **tous utilisateurs**
- **Filtres appliqués** pour ciblage précis

#### Actions en masse
- **Notification groupée** : Message à utilisateurs sélectionnés
- **Réinitialisation MdP** : Pour compromissions sécurité
- **Export sélection** : Données utilisateurs choisis
- **Modification rôle** : Promotion/rétrogradation multiple

## ⚽ Gestion des matchs

Accès via `/admin/matches` ou création directe.

### Création de matchs

#### Match individuel
```
📅 Nouveau match
┌─────────────────────────────────┐
│ Date: [15/01/2024] 📅           │
│ Heure: [12:00] 🕐              │  
│ Capacité: [12] joueurs          │
│ Terrain: [Principal] 🏟️        │
│ Notes: [Optionnel]              │
│                                 │
│ [Créer match] [Annuler]         │
└─────────────────────────────────┘
```

#### Matchs récurrents
```
🔄 Matchs récurrents  
┌─────────────────────────────────┐
│ Début: [15/01/2024] 📅          │
│ Fin: [15/03/2024] 📅            │
│ Jours: ☑️Lun ☑️Mer ☑️Ven      │
│ Heure: [12:00] 🕐              │
│ Capacité: [12] joueurs          │  
│                                 │
│ Aperçu: 24 matchs créés         │
│ [Créer série] [Annuler]         │
└─────────────────────────────────┘
```

#### Contraintes automatiques
- **Horaires autorisés** : 12h-14h uniquement (jours ouvrés)
- **Anticipation** : Maximum 2 semaines à l'avance
- **Conflits** : Détection collisions horaires
- **Validation** : Format date/heure, capacité

### Gestion matches existants

#### Vue calendrier
```
📅 Janvier 2024
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │
│     │     │⚽12h│     │⚽12h│     │     │
│     │     │8/12 │     │FULL │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 15  │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │
│⚽12h │     │⚽12h│     │⚽12h│     │     │
│4/12 │     │6/12 │     │10/12│     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

#### Actions sur matchs
- **Modifier** : Date, heure, capacité, statut
- **Annuler** : Avec notification automatique joueurs
- **Dupliquer** : Créer match similaire autre date
- **Exporter** : Calendrier ICS, planning PDF

#### Gestion des joueurs

**Force-join** (inscription forcée)
```typescript
// Cas d'usage
- Match complet mais exception accordée
- Annulation dernière minute, remplacement
- Test système avec utilisateurs fictifs
```

**Force-leave** (désinscription forcée)  
```typescript
// Cas d'usage
- Comportement inapproprié
- Non-respect règlement
- Résolution conflit entre joueurs
```

**Remplacement joueur**
```typescript
// Processus
1. Désinscrire joueur A
2. Inscrire joueur B à sa place  
3. Notifier les deux joueurs
4. Maintenir historique changements
```

### Suivi temps réel

#### Dashboard match live
```
⚽ Match Lundi 15/01 - 12h00
┌─────────────────────────────────┐
│ Statut: 🟢 OUVERT              │
│ Joueurs: 8/12 inscrits          │
│ Liste attente: 3 personnes      │
│ Dernière activité: Il y a 5min  │
│                                 │
│ Inscriptions récentes:          │
│ • Alice Martin (10:30)          │
│ • Bob Dupont (10:45)           │  
│ • Claire Durand (11:00)         │
└─────────────────────────────────┘
```

## 🔔 Système de notifications

Accès via `/admin/announcements`.

### Types de notifications

#### Annonces globales
Messages diffusés à tous les utilisateurs :
```
📢 Nouvelle annonce
┌─────────────────────────────────┐
│ Titre: [Modification horaires]  │
│ Priorité: [🟡 Normale ▼]       │
│ Contenu:                        │
│ ┌─────────────────────────────┐ │
│ │ Les matchs du vendredi sont │ │
│ │ décalés à 13h cette semaine │ │
│ │ en raison de...             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📧 Email: ☑️ Envoyer par email │
│ 🔔 Push: ☑️ Notification push  │
│                                 │
│ [Publier] [Prévisualiser]       │
└─────────────────────────────────┘
```

#### Niveaux de priorité
- **🔴 Urgente** : Annulations, problèmes sécurité
- **🟡 Normale** : Changements horaires, nouvelles fonctionnalités  
- **🟢 Info** : Conseils, rappels généraux

#### Ciblage utilisateurs
- **Tous les utilisateurs** : Annonces générales
- **Utilisateurs actifs** : Dernière connexion <30j
- **Participants match** : Inscrits à un match spécifique
- **Filtre custom** : Selon critères personnalisés

### Notifications automatiques

Le système envoie automatiquement :

#### Rappels matchs
- **24h avant** : Confirmation participation
- **2h avant** : Dernier rappel avec détails
- **Match terminé** : Remerciement, demande feedback

#### Gestion inscriptions
- **Inscription confirmée** : Place obtenue
- **Liste d'attente** : Position en file
- **Promotion** : Place libérée, inscription confirmée
- **Annulation match** : Information avec éventuels remboursements

#### Système
- **Maintenance programmée** : Prévenir indisponibilité
- **Nouvelles fonctionnalités** : Présentation améliorations
- **Rappels inactivité** : Encourager reconnexion

### Gestion des templates

#### Templates email prédéfinis
```html
<!-- Exemple template rappel match -->
<!DOCTYPE html>
<html>
<head>
  <title>Rappel : Match demain !</title>
</head>
<body>
  <h1>🥅 Votre match approche !</h1>
  <p>Bonjour {{pseudo}},</p>
  
  <p>Nous vous rappelons votre match prévu :</p>
  <ul>
    <li>📅 Date : {{match.date}}</li>
    <li>🕐 Heure : {{match.time}}</li>
    <li>📍 Lieu : {{match.location}}</li>
    <li>⚽ Joueurs inscrits : {{match.players}}/{{match.maxPlayers}}</li>
  </ul>
  
  <p>À bientôt sur le terrain !</p>
</body>
</html>
```

#### Variables disponibles
- **Utilisateur** : `{{pseudo}}`, `{{email}}`, `{{avatar}}`
- **Match** : `{{date}}`, `{{time}}`, `{{players}}`, `{{location}}`
- **Système** : `{{appName}}`, `{{supportEmail}}`, `{{currentDate}}`

### Analytics notifications

#### Métriques d'envoi
- **Taux de livraison** : Emails arrivés vs envoyés
- **Taux d'ouverture** : Emails ouverts vs livrés  
- **Taux de clic** : Liens cliqués vs ouverts
- **Désabonnements** : Users optant out des notifications

#### Optimisation
- **A/B testing** : Différentes versions templates
- **Horaires optimaux** : Meilleurs moments d'envoi
- **Personnalisation** : Adaptation selon profil user
- **Fréquence** : Éviter spam, trouver équilibre

## 📈 Statistiques et reporting

Accès via `/admin/statistics`.

### Dashboard statistiques

#### Vue d'ensemble
```
📊 Statistiques globales (30 derniers jours)
┌─────────────────────────────────────────────┐
│ 👥 Nouveaux utilisateurs: 23 (+15%)        │
│ ⚽ Matchs organisés: 18 (-5%)              │
│ 🎯 Taux d'occupation moyen: 87% (+3%)      │
│ 🔔 Notifications envoyées: 456 (+12%)     │
│ ⭐ Satisfaction moyenne: 4.6/5 (stable)   │
└─────────────────────────────────────────────┘
```

#### Graphiques temps réel
- **Inscriptions par jour** : Évolution activité
- **Pic d'utilisation** : Heures de forte activité
- **Taux d'occupation** : Pourcentage places prises
- **Performance API** : Temps de réponse moyen

### Analytics détaillées

#### Comportement utilisateurs
```
👥 Analyse utilisateurs
┌─────────────────────────────────┐
│ Utilisateurs actifs (7j): 89    │
│ Temps session moyen: 8min 30s   │
│ Pages/session: 4.2              │
│ Taux rebond: 12%                │
│                                 │
│ Actions populaires:             │
│ 1. Consulter matchs (67%)       │
│ 2. S'inscrire match (45%)       │
│ 3. Voir profil (34%)            │
│ 4. Modifier profil (12%)        │
└─────────────────────────────────┘
```

#### Performance matchs
```
⚽ Analyse matchs
┌─────────────────────────────────┐
│ Taux remplissage moyen: 87%     │
│ Matches complets: 67%           │
│ Liste attente moyenne: 2.3      │
│ Annulations: 3% (-1%)           │
│                                 │
│ Créneaux populaires:            │
│ 1. Lundi 12h (95% remplissage)  │
│ 2. Vendredi 12h (92%)           │
│ 3. Mercredi 12h (85%)           │
│ 4. Mardi 12h (78%)             │
└─────────────────────────────────┘
```

### Reports automatisés

#### Rapports hebdomadaires
Généré chaque lundi et envoyé aux admins :
```
📧 Rapport hebdomaire - Semaine 3, 2024

🎯 Points clés:
• 18 matchs organisés (+2 vs semaine précédente)
• 156 inscriptions au total
• Taux d'occupation: 89% (excellent)
• 0 incident technique

📈 Tendances:
• Forte activité lundi/vendredi
• Nouveau record: 12 inscrits en 5min
• Croissance utilisateurs: +5% cette semaine

⚠️ Points d'attention:
• Match mardi 16/01 seulement 6 inscrits
• Pics de charge 11h45-12h15
```

#### Rapports mensuels
Analyse approfondie avec recommandations :
```
📊 Rapport mensuel - Janvier 2024

📈 Performance globale: EXCELLENTE
• 67 matchs organisés (objectif: 60) ✅
• 523 inscriptions totales 
• Satisfaction: 4.7/5 (objectif: 4.5) ✅
• Disponibilité: 99.8% (objectif: 99%) ✅

🔍 Insights métier:
• Forte demande créneaux 12h-13h
• Préférence marquée lundi/mercredi/vendredi  
• 23% utilisateurs participent >1 fois/semaine
• Taux fidélisation nouveaux: 78%

💡 Recommandations:
• Ajouter créneaux 13h-14h si terrain libre
• Campagne incitation mardi/jeudi
• Système parrainage pour acquisition
• Améliorer UX mobile (25% trafic mobile)
```

### Export et intégration

#### Formats d'export
- **Excel/CSV** : Analyse dans tableurs
- **PDF** : Rapports executifs formatés
- **JSON** : Intégration systèmes tiers
- **API** : Accès programmatique données

#### Intégrations possibles
```typescript
// Exemples intégrations
- Google Analytics : Tracking web
- Mixpanel : Analytics comportement  
- Tableau : Dashboards avancés
- Power BI : Reporting entreprise
- Slack : Notifications équipe admin
```

## 📡 Monitoring système

### Health checks automatiques

#### API Santé (`/api/health`)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:30:45Z",
  "uptime": "72h 15m 30s",
  "services": {
    "database": {
      "status": "healthy", 
      "responseTime": "12ms",
      "connections": "8/20"
    },
    "redis": {
      "status": "healthy",
      "responseTime": "3ms", 
      "memory": "45MB/1GB"
    },
    "auth": {
      "status": "healthy",
      "activeSessions": 127
    }
  },
  "metrics": {
    "apiCalls": 1247,
    "errors": 3,
    "avgResponseTime": "145ms"
  }
}
```

#### Alertes automatiques
Le système surveille et alerte sur :
- **API response time >500ms** : Performance dégradée
- **Error rate >5%** : Problèmes applicatifs
- **Database connections >18/20** : Surcharge DB
- **Memory usage >80%** : Ressources système
- **Disk space <10%** : Espace de stockage

### Logs structurés

#### Format standardisé
```json
{
  "timestamp": "2024-01-15T12:30:45.123Z",
  "level": "info",
  "service": "api",
  "operation": "match_join", 
  "userId": "user123",
  "matchId": "match456",
  "duration": 145,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "previousStatus": "waitlisted",
    "newStatus": "registered",
    "position": 8
  }
}
```

#### Niveaux de log
- **ERROR** : Erreurs applicatives, exceptions
- **WARN** : Situations anormales, dégradations
- **INFO** : Opérations importantes, métriques
- **DEBUG** : Détails techniques (dev seulement)

### Performance monitoring

#### Métriques collectées
```typescript
// Métriques application
- Request/Response times par endpoint
- Database query performance  
- Cache hit/miss ratios
- User session analytics
- Error rates et types
- Memory/CPU usage patterns

// Métriques métier
- Match fill rates
- User engagement scores
- Notification delivery success
- Payment processing (si applicable)
```

#### Dashboards de monitoring
Accessible via `/admin/monitoring` :
```
📊 Performance temps réel
┌─────────────────────────────────┐
│ 🟢 API Health: Healthy         │
│ ⚡ Avg Response: 134ms         │
│ 📈 Requests/min: 45            │
│ 💾 Memory usage: 67%           │
│ 🗃️ DB connections: 12/20      │
│ 🔴 Redis: Cache miss 23%       │
└─────────────────────────────────┘
```

## 🔧 Maintenance

### Maintenance programmée

#### Fenêtres de maintenance
Recommandations pour maintenance système :
- **Quotidienne** : 3h00-4h00 (trafic minimal)
- **Hebdomadaire** : Dimanche 2h00-6h00
- **Mensuelle** : Premier dimanche 0h00-8h00

#### Checklist maintenance
```bash
# Maintenance hebdomadaire
□ Vérifier santé base de données
□ Analyser logs erreurs semaine
□ Nettoyer sessions expirées  
□ Backup vérification restauration
□ Mise à jour dépendances sécurité
□ Test smoke fonctionnalités critiques
□ Analyse performance API
□ Vérification espace disque
□ Review métriques utilisateurs
□ Test notifications email/push
```

### Backups et restauration

#### Stratégie de sauvegarde
```typescript
// Backup automatique
- Database: Dump PostgreSQL quotidien
- Files: Images, avatars, documents  
- Configuration: Variables environnement
- Logs: Archive 90 jours glissants
- Metrics: Export Prometheus mensuel

// Rétention
- Quotidien: 30 jours
- Hebdomadaire: 12 semaines  
- Mensuel: 12 mois
- Annuel: 5 ans
```

#### Procédure de restauration
```bash
# Restauration d'urgence
1. Arrêter application
2. Restaurer dump database
3. Restaurer fichiers statiques
4. Vérifier configuration  
5. Test santé services
6. Restart application
7. Validation fonctionnelle
8. Communication utilisateurs
```

### Mise à jour système

#### Processus de déploiement
```bash
# Déploiement production
1. Tests complets environnement staging
2. Backup complet avant déploiement
3. Mise en mode maintenance
4. Deploy nouvelle version
5. Migration base données si nécessaire
6. Test smoke post-déploiement
7. Retirer mode maintenance
8. Monitoring renforcé 24h
```

#### Rollback d'urgence
```bash
# Si problème critique post-déploiement
1. Mode maintenance immédiat
2. Rollback version précédente
3. Restauration DB si migration
4. Validation fonctionnalité critique
5. Communication incident
6. Post-mortem et correctifs
```

## 🛡️ Sécurité

### Authentification et autorisation

#### Gestion des sessions
```typescript
// Configuration sécurisée
Session: {
  duration: 7 * 24 * 60 * 60, // 7 jours
  rotation: 24 * 60 * 60,     // Rotation quotidienne
  httpOnly: true,              // Cookies sécurisés
  sameSite: 'strict',         // Protection CSRF
  secure: true                // HTTPS uniquement
}
```

#### Rate limiting
```typescript
// Limites par endpoint
/api/auth/login: 5 req/min    // Anti brute-force
/api/auth/register: 3 req/min // Anti spam
/api/matches: 60 req/min      // Usage normal
/api/admin/*: 120 req/min     // Admin plus de liberté
```

### Protection des données

#### Chiffrement
- **Données transit** : HTTPS/TLS 1.3 obligatoire
- **Données repos** : Base données chiffrée
- **Mots de passe** : bcrypt avec salt rounds=12
- **Sessions** : Tokens signés cryptographiquement

#### Anonymisation
```typescript
// RGPD compliance
export async function anonymizeUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${Date.now()}@deleted.local`,
      pseudo: `Utilisateur supprimé`,
      avatar: null,
      // Garder statistiques anonymisées
    }
  })
}
```

### Audit et conformité

#### Logs d'audit
Traçabilité complète actions sensibles :
```json
{
  "timestamp": "2024-01-15T12:30:45Z",
  "type": "admin_action",
  "adminId": "admin123", 
  "action": "user_password_reset",
  "targetUserId": "user456",
  "ip": "192.168.1.100",
  "success": true,
  "metadata": {
    "reason": "User forgot password",
    "notificationSent": true
  }
}
```

#### Actions auditées
- Connexions administrateur
- Modifications utilisateurs  
- Créations/suppressions matchs
- Accès données sensibles
- Changements configuration
- Exports données utilisateurs

### Incident de sécurité

#### Procédure d'urgence
```bash
# En cas de compromission suspectée
1. Isoler système affecté
2. Préserver preuves (logs, dumps)
3. Évaluer étendue compromission  
4. Invalider sessions suspectes
5. Changer secrets/clés affectés
6. Notifier utilisateurs si nécessaire
7. Corriger vulnérabilité
8. Renforcer monitoring
```

#### Communication de crise
- **Notification immédiate** : Équipe technique
- **Évaluation impact** : Données affectées
- **Communication utilisateurs** : Transparence appropriée
- **Autorités compétentes** : Si données personnelles
- **Post-mortem** : Analyse et amélioration

## 🚨 Dépannage

### Problèmes fréquents

#### Application inaccessible
```bash
# Diagnostic
1. Vérifier status services (PM2/Docker)
2. Consulter logs application
3. Tester connectivité DB/Redis
4. Vérifier espace disque  
5. Analyser charge système

# Actions correctives
- Restart services si nécessaire
- Nettoyer logs si disque plein
- Augmenter ressources si surcharge
- Basculer mode dégradé si critique
```

#### Performance dégradée
```bash
# Diagnostic performance
1. Analyser métriques temps réponse
2. Identifier requêtes lentes DB
3. Vérifier taux cache hit/miss
4. Monitorer usage mémoire/CPU
5. Examiner patterns utilisation

# Optimisations possibles  
- Redémarrer cache Redis
- Optimiser requêtes identifiées
- Ajuster paramètres cache
- Scaling horizontal si nécessaire
```

#### Problèmes authentification
```bash
# Symptoms: Utilisateurs ne peuvent pas se connecter
1. Vérifier service auth disponible
2. Tester génération/validation tokens
3. Contrôler sessions DB
4. Vérifier rate limiting
5. Examiner logs erreurs auth

# Solutions
- Restart service authentification
- Nettoyer sessions expirées
- Ajuster limits si trop restrictifs
- Invalider cache auth si corrompu
```

### Outils de diagnostic

#### Commandes utiles
```bash
# Health check rapide
curl http://localhost:3000/api/health

# Logs en temps réel
tail -f /var/log/futsal/app.log | jq

# Statut services
docker ps
pm2 status

# Performance DB
psql -c "SELECT * FROM pg_stat_activity;"

# Cache Redis
redis-cli info stats
```

#### Dashboard monitoring
Accès `/admin/system` pour :
- **Status services** en temps réel
- **Métriques performance** graphiques
- **Logs récents** avec filtres
- **Actions correctives** rapides

### Escalade et support

#### Niveaux d'escalade
1. **Auto-résolution** : Restart automatique, fallbacks
2. **Équipe technique** : Diagnostic et correction rapide  
3. **Support éditeur** : Problèmes complexes intégrations
4. **Prestataire infra** : Problèmes hardware/réseau

#### Contacts d'urgence
```yaml
# Équipe technique
Primary: admin@futsal.com
Secondary: tech@futsal.com  
Phone: +33-1-XX-XX-XX-XX (24/7)

# Prestataires
Database: postgresql-support@provider.com
Hosting: infrastructure@provider.com
CDN: cdn-support@provider.com
```

---

## 🎯 Checklist administrateur quotidienne

### Matin (9h00)
- [ ] ✅ Vérifier dashboard santé système
- [ ] ✅ Consulter rapport erreurs nocturnes
- [ ] ✅ Valider backups automatiques
- [ ] ✅ Réviser métriques performance  
- [ ] ✅ Contrôler nouvelles inscriptions

### Midi (12h00) - Pic d'activité
- [ ] ⚡ Monitoring temps réel inscriptions
- [ ] ⚡ Vérifier performance API  
- [ ] ⚡ Surveiller taux d'erreurs
- [ ] ⚡ Support utilisateurs si problèmes

### Soir (18h00)
- [ ] 📊 Analyser statistiques journée
- [ ] 📧 Traiter messages support utilisateurs  
- [ ] 🔔 Programmer annonces si nécessaire
- [ ] 📈 Vérifier objectifs remplissage matchs

### Points d'attention permanents
- **Sécurité** : Aucune tentative suspecte
- **Performance** : Temps réponse <200ms
- **Disponibilité** : Uptime >99.5%
- **Satisfaction** : Score moyen >4.5/5

---

**🛡️ L'administration d'une SaaS nécessite vigilance et proactivité. Ce guide vous donne tous les outils pour maintenir un service de qualité !**

---

*Guide mis à jour le 2024-02-15 | Version 1.0.0*
*Questions techniques : [admin@futsal.app](mailto:admin@futsal.app)*