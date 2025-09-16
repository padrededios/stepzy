# 📖 Guide Utilisateur - Futsal Reservation SaaS

Bienvenue dans l'application de réservation de matchs de futsal ! Ce guide vous accompagnera pour tirer le meilleur parti de la plateforme.

## 📋 Table des matières

- [Première connexion](#-première-connexion)
- [Navigation](#-navigation) 
- [Dashboard](#-dashboard)
- [Gestion des matchs](#-gestion-des-matchs)
- [Profil utilisateur](#-profil-utilisateur)
- [Notifications](#-notifications)
- [Conseils d'utilisation](#-conseils-dutilisation)
- [Dépannage](#-dépannage)

## 🚀 Première connexion

### Création de compte

1. **Accédez à l'application** via l'URL fournie par votre administrateur
2. **Cliquez sur "S'inscrire"** en haut à droite
3. **Remplissez le formulaire** :
   - **Email** : Adresse email valide (sera votre identifiant)
   - **Pseudo** : Nom d'affichage (2-20 caractères, unique)
   - **Mot de passe** : Minimum 8 caractères avec majuscule, minuscule et chiffre

4. **Validez votre inscription** - Vous serez automatiquement connecté

### Première connexion

- **Email** : Votre adresse email d'inscription
- **Mot de passe** : Le mot de passe choisi
- **Se souvenir de moi** : Garde la session active 7 jours

> 💡 **Astuce** : Votre avatar est généré automatiquement. Vous pourrez le personnaliser dans votre profil.

## 🧭 Navigation

### Header (en haut)
- **Logo Futsal** : Retour au dashboard
- **Notifications** 🔔 : Centre de notifications avec compteur
- **Menu utilisateur** : Photo de profil → Profil, Déconnexion

### Sidebar (à gauche)
- **🏠 Dashboard** : Vue d'ensemble des matchs
- **⚽ Mes Matchs** : Vos inscriptions et historique
- **👤 Profil** : Paramètres personnels
- **🔔 Notifications** : Toutes vos notifications

> 📱 **Mobile** : Le menu latéral se transforme en menu hamburger sur mobile.

## 🏠 Dashboard

Le dashboard est votre page d'accueil. Il affiche :

### Vue d'ensemble
- **Statistiques personnelles** : Matchs joués, à venir, badge niveau
- **Prochains matchs** : Vos inscriptions confirmées
- **Annonces** : Communications importantes des administrateurs

### Section Matchs disponibles

Les matchs sont organisés par **semaine courante** et **semaine suivante** :

```
📅 Semaine du 15-19 Janvier 2024
┌─────────────────────────────────┐
│ 🕐 Lundi 15/01 - 12h00         │
│ ⚽ 8/12 joueurs inscrits        │
│ 📍 Terrain principal           │
│ [S'INSCRIRE] [Voir détails]    │
└─────────────────────────────────┘
```

### États des matchs
- **🟢 OUVERT** : Places disponibles, inscription possible
- **🟡 COMPLET** : Inscription en liste d'attente
- **🔴 ANNULÉ** : Match annulé par l'administration
- **✅ TERMINÉ** : Match joué, résultats disponibles

## ⚽ Gestion des matchs

### S'inscrire à un match

1. **Dans le dashboard**, trouvez un match qui vous intéresse
2. **Cliquez sur "S'inscrire"** 
3. **Confirmation** : 
   - Si places disponibles → Inscription confirmée ✅
   - Si complet → Ajouté en liste d'attente 🕐

### Vue détaillée d'un match

Cliquez sur **"Voir détails"** pour accéder à la vue terrain :

```
    🥅 TERRAIN DE FUTSAL 🥅
    
    ÉQUIPE 1           ÉQUIPE 2
    ┌────────┐        ┌────────┐
    │   👤   │        │   👤   │  
    │  Alex  │        │  Marie │
    └────────┘        └────────┘
    
    ┌────────┐        ┌────────┐
    │   👤   │        │   👤   │
    │  Tom   │        │  Lisa  │
    └────────┘        └────────┘
    
    Gardien: Paul      Gardien: Emma
```

### Se désinscrire

- **Depuis le dashboard** : Cliquez sur "Se désinscrire" 
- **Depuis la vue match** : Cliquez sur votre avatar
- **Délai** : Possible jusqu'à 2h avant le match

> ⚠️ **Important** : Si vous vous désinscrivez, le premier joueur en liste d'attente prendra votre place automatiquement.

### Liste d'attente

Quand un match est complet :
1. **Inscription en liste d'attente** automatique
2. **Position indiquée** : "Position 3 en liste d'attente"
3. **Promotion automatique** si quelqu'un se désiste
4. **Notification immédiate** si vous obtenez une place

## 👤 Profil utilisateur

Accédez à votre profil via votre photo en haut à droite.

### Informations personnelles
- **Avatar** : Image de profil (auto-générée ou uploadée)
- **Pseudo** : Nom d'affichage (modifiable)
- **Email** : Adresse email (non modifiable)
- **Rôle** : Utilisateur standard ou Administrateur

### Statistiques
- **📊 Matchs joués** : Nombre total de participations
- **⏰ Matchs à venir** : Vos prochaines inscriptions  
- **🏆 Taux de présence** : % de présence aux matchs inscrits
- **📈 Niveau** : Badge selon votre activité

### Historique des matchs
Liste chronologique de tous vos matchs :
```
✅ Lundi 08/01 - 12h00 | Joué | ⭐⭐⭐⭐⭐
🕐 Lundi 15/01 - 12h00 | À venir | Position confirmée  
❌ Lundi 22/01 - 12h00 | Annulé | Remboursé
```

### Système de badges

Gagnez des badges selon votre activité :

- **🏆 Premier match** : Participation à votre premier match
- **🔥 Série** : 5 matchs consécutifs sans absence
- **📅 Régulier** : 10 matchs dans le mois
- **⭐ MVP** : Élu meilleur joueur du match
- **🎯 Précis** : 90% de taux de présence
- **🚀 Pilier** : 50 matchs joués
- **👑 Légende** : 100 matchs joués
- **💎 Diamant** : 200 matchs joués

### Paramètres notifications
Personnalisez vos préférences :
- **📧 Email** : Rappels et annonces par email
- **🔔 Push navigateur** : Notifications instantanées
- **⏰ Rappels** : 24h et 2h avant les matchs
- **📢 Annonces** : Communications administrateurs

## 🔔 Notifications

### Centre de notifications

Le compteur en haut à droite 🔔 indique vos notifications non lues.

Cliquez pour voir :
- **Rappels matchs** : 24h et 2h avant
- **Confirmations** : Inscription, promotion liste attente
- **Annonces** : Messages des administrateurs
- **Changements** : Modification ou annulation matchs

### Types de notifications

#### 📅 Rappels automatiques
```
🔔 Rappel : Match demain !
Lundi 15/01 à 12h00 - Terrain principal
8/12 joueurs inscrits
```

#### ✅ Confirmations
```  
🔔 Inscription confirmée
Vous êtes inscrit au match du Lundi 15/01 à 12h00
Position : Joueur confirmé
```

#### 🕐 Liste d'attente
```
🔔 Promotion !
Une place s'est libérée ! Vous êtes maintenant 
inscrit au match du Lundi 15/01 à 12h00
```

#### 📢 Annonces admin
```
🔔 Nouvelle annonce (Priorité Haute)
Modification des horaires : Les matchs du vendredi 
sont décalés à 13h00 cette semaine.
```

### Page notifications complète

Accédez via la sidebar pour :
- **Voir toutes** les notifications
- **Filtrer** : Toutes / Non lues
- **Marquer comme lues**
- **Supprimer** les anciennes

## 💡 Conseils d'utilisation

### Optimiser vos inscriptions
- **Inscrivez-vous tôt** : Les places partent vite !
- **Vérifiez régulièrement** : Des places se libèrent souvent
- **Liste d'attente** : N'hésitez pas, les promotions sont fréquentes
- **Notifications activées** : Ne ratez aucune opportunité

### Être un bon joueur
- **Respectez vos engagements** : Ne vous désinscrivez qu'en cas d'urgence
- **Prévenez à l'avance** : Au moins 4h avant si possible  
- **Soyez ponctuel** : Arrivez 10 minutes avant l'heure
- **Fair-play** : Respectez joueurs et arbitres

### Gérer votre profil
- **Photo représentative** : Aide les autres à vous reconnaître
- **Pseudo clair** : Évitez les caractères spéciaux
- **Notifications** : Configurez selon vos préférences
- **Statistiques** : Suivez votre progression

### Maximiser l'expérience
- **Participez régulièrement** : Gagnez des badges
- **Variez les créneaux** : Découvrez d'autres joueurs
- **Feedback** : Signalez problèmes aux administrateurs
- **Communauté** : Respectez l'esprit futsal !

## 🛠️ Dépannage

### Problèmes de connexion

**❌ "Email ou mot de passe incorrect"**
1. Vérifiez la casse (majuscules/minuscules)
2. Utilisez "Mot de passe oublié" si nécessaire
3. Contactez l'administrateur si problème persiste

**❌ "Trop de tentatives"**
- Attendez 5 minutes avant de retenter
- Le système bloque temporairement après 5 échecs

### Problèmes d'inscription

**❌ "Match complet"**
- Normal, vous êtes en liste d'attente
- Vérifiez votre position dans les notifications
- Restez inscrit, des places se libèrent souvent

**❌ "Vous êtes déjà inscrit"**
- Vérifiez dans "Mes Matchs" 
- Vous êtes peut-être en liste d'attente

**❌ "Match dans moins de 2h"**
- Les inscriptions ferment 2h avant
- Contactez un administrateur en urgence

### Problèmes techniques

**🐌 Application lente**
1. Videz le cache navigateur (Ctrl+F5)
2. Vérifiez votre connexion internet
3. Essayez en navigation privée

**📱 Problème mobile**
1. Mettez à jour votre navigateur
2. Essayez avec Chrome ou Safari
3. Activez JavaScript si désactivé

**🔔 Pas de notifications**
1. Vérifiez paramètres profil → Notifications
2. Autorisez notifications dans navigateur
3. Vérifiez dossier spam pour emails

### Problèmes de compte

**👤 Avatar manquant**
- Normal au début, avatar auto-généré
- Rechargez la page (F5)
- Uploadez photo personnelle si souhaité

**📊 Statistiques incorrectes**
- Données mises à jour toutes les heures
- Rechargez la page pour actualiser
- Contactez admin si écart important

### Besoin d'aide ?

Si votre problème persiste :

1. **Vérifiez la FAQ** : [docs/faq.md](faq.md)
2. **Contactez l'équipe** :
   - 📧 Email : support@futsal.app
   - 💬 Discussion dans l'app (si disponible)
   - 📞 Urgences : Numéro fourni par admin

3. **Informations utiles à fournir** :
   - Navigateur utilisé (Chrome, Firefox, Safari...)
   - Système d'exploitation (Windows, Mac, Android...)
   - Message d'erreur exact
   - Actions effectuées avant le problème

---

## 🎯 Résumé rapide

### Pour bien commencer :
1. ✅ **Inscrivez-vous** avec email valide
2. ✅ **Complétez votre profil** (pseudo, avatar)  
3. ✅ **Activez les notifications** pour ne rien rater
4. ✅ **Explorez le dashboard** et inscrivez-vous à un match
5. ✅ **Respectez vos engagements** et amusez-vous !

### Raccourcis clavier utiles :
- **F5** : Actualiser la page
- **Ctrl+F5** : Actualiser et vider le cache
- **Échap** : Fermer modales et menus
- **Tab** : Navigation clavier accessible

**🎊 Bienvenue dans la communauté futsal ! Bon jeu ! ⚽**

---

*Guide mis à jour le 2024-02-15 | Version 1.0.0*
*Pour suggestions d'amélioration : [docs@futsal.app](mailto:docs@futsal.app)*