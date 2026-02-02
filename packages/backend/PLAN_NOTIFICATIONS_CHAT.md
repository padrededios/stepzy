# Plan: Notifications et Chat pour Stepzy

**Dernière mise à jour:** 2026-01-20
**Statut global:** ✅ TERMINÉ - Toutes les phases (1-6) complétées

---

## Résumé

Implémentation de deux fonctionnalités majeures :
1. **Notifications améliorées** - Confirmation/annulation de session, rappels, nouvelles sessions + suppression par lot
2. **Chat par activité** - Salons de messagerie style iMessage avec modération automatique et temps réel via WebSocket

---

## Phase 1: Schema Prisma et Infrastructure ✅ TERMINÉE

### Tâches
- [x] 1.1 Étendre l'enum `NotificationType` avec les nouveaux types (session_confirmed, session_cancelled, session_reminder, new_sessions_available)
- [x] 1.2 Ajouter les champs `activityId` et `sessionId` au modèle `Notification`
- [x] 1.3 Créer le modèle `ChatRoom` (un salon par activité)
- [x] 1.4 Créer le modèle `ChatMessage` avec champs de modération
- [x] 1.5 Créer le modèle `ChatRoomReadStatus` pour le suivi des messages non lus
- [x] 1.6 Mettre à jour les relations dans User et Activity
- [x] 1.7 Exécuter la migration Prisma
- [x] 1.8 Installer les dépendances : `@fastify/websocket`, `obscenity`

### Fichiers modifiés/créés
- `packages/backend/prisma/schema.prisma` ✅
- `packages/backend/package.json` ✅

---

## Phase 2: Backend Notifications ✅ TERMINÉE

### Tâches
- [x] 2.1 Créer `notification.service.ts` avec méthodes :
  - `notifySessionConfirmed()` - quand session atteint minPlayers
  - `notifySessionCancelled()` - quand session annulée
  - `createSessionReminders()` - rappels 24h avant
  - `notifyNewSessions()` - nouvelles sessions pour activité
  - `deleteNotification()` / `deleteMultipleNotifications()` / `deleteAllNotifications()`
- [x] 2.2 Créer `notifications.routes.ts` :
  - `GET /api/notifications` - liste paginée
  - `GET /api/notifications/count` - compteur non lues
  - `PUT /api/notifications/:id` - marquer comme lue
  - `PUT /api/notifications` - marquer toutes comme lues
  - `DELETE /api/notifications/:id` - supprimer une
  - `DELETE /api/notifications` - supprimer par lot (body: ids[] ou all:true)
- [x] 2.3 Créer `reminder.job.ts` pour les rappels automatiques
- [x] 2.4 Intégrer les appels de notification dans `activity-session.service.ts`

### Fichiers créés/modifiés
- `packages/backend/src/services/notification.service.ts` ✅ (nouveau)
- `packages/backend/src/routes/notifications.routes.ts` ✅ (nouveau)
- `packages/backend/src/jobs/reminder.job.ts` ✅ (nouveau)
- `packages/backend/src/services/activity-session.service.ts` ✅ (modifié)
- `packages/backend/src/index.ts` ✅ (modifié - routes + job)

---

## Phase 3: Backend Chat et WebSocket ✅ TERMINÉE

### Tâches
- [x] 3.1 Créer `moderation.service.ts` avec dictionnaire français (obscenity)
- [x] 3.2 Créer `chat.service.ts` :
  - `getOrCreateRoom()` - obtenir/créer salon pour activité
  - `canAccessRoom()` - vérifier accès utilisateur
  - `sendMessage()` - envoyer avec modération
  - `getMessages()` - messages paginés
  - `markAsRead()` - marquer comme lu
  - `getUserRooms()` - salons accessibles
  - `getUnreadCounts()` - compteurs non lus
- [x] 3.3 Configurer WebSocket (`packages/backend/src/websocket/index.ts`) :
  - `/ws/chat/:roomId` - connexion salon
  - `/ws/notifications` - notifications temps réel
  - Broadcast aux membres du salon
- [x] 3.4 Créer `chat.routes.ts` :
  - `GET /api/chat/rooms` - liste salons
  - `GET /api/chat/rooms/:roomId/messages` - messages
  - `POST /api/chat/rooms/:roomId/messages` - envoyer
  - `PUT /api/chat/rooms/:roomId/read` - marquer lu
  - `GET /api/chat/unread` - compteurs non lus
  - `GET /api/chat/activity/:activityId/room` - obtenir/créer salon pour une activité

### Fichiers créés/modifiés
- `packages/backend/src/services/moderation.service.ts` ✅ (nouveau)
- `packages/backend/src/services/chat.service.ts` ✅ (nouveau)
- `packages/backend/src/websocket/index.ts` ✅ (nouveau)
- `packages/backend/src/routes/chat.routes.ts` ✅ (nouveau)
- `packages/backend/src/index.ts` ✅ (modifié - WebSocket + routes chat)

---

## Phase 4: Frontend Notifications ✅ TERMINÉE

### Tâches
- [x] 4.1 Créer hook `useNotifications.ts` avec WebSocket temps réel et sélection multiple
- [x] 4.2 Améliorer `NotificationCenter.tsx` :
  - Checkboxes pour sélection
  - Bouton "Tout sélectionner"
  - Bouton "Supprimer la sélection"
  - Icônes par type de notification
- [x] 4.3 Améliorer page `/notifications` :
  - Interface de sélection multiple
  - Actions en lot
  - Liens vers sessions/activités
- [x] 4.4 Connecter l'icône notification du Header au système temps réel

### Fichiers créés/modifiés
- `packages/web-app/src/hooks/useNotifications.ts` ✅ (nouveau)
- `packages/web-app/src/components/notifications/NotificationCenter.tsx` ✅ (modifié)
- `packages/web-app/src/app/(dashboard)/notifications/page.tsx` ✅ (modifié)
- `packages/web-app/src/components/layout/Header.tsx` ✅ (modifié)

---

## Phase 5: Frontend Chat ✅ TERMINÉE

### Tâches
- [x] 5.1 Créer hooks :
  - `useChat.ts` - connexion WebSocket salon, messages, envoi
  - `useChatRooms.ts` - liste salons, compteurs non lus
- [x] 5.2 Créer composants chat (`packages/web-app/src/components/chat/`) :
  - `ChatRoomList.tsx` - liste des salons avec badges non lus
  - `ChatRoom.tsx` - vue conversation complète
  - `ChatMessage.tsx` - bulle style iMessage (gauche/droite selon sender)
  - `ChatInput.tsx` - zone de saisie avec validation
- [x] 5.3 Créer page `/messages` :
  - Layout split desktop : liste salons | conversation
  - Navigation mobile entre vues
- [x] 5.5 Connecter l'icône messages du Header avec badge total non lus

### Fichiers créés/modifiés
- `packages/web-app/src/hooks/useChat.ts` ✅ (nouveau)
- `packages/web-app/src/hooks/useChatRooms.ts` ✅ (nouveau)
- `packages/web-app/src/components/chat/ChatRoomList.tsx` ✅ (nouveau)
- `packages/web-app/src/components/chat/ChatRoom.tsx` ✅ (nouveau)
- `packages/web-app/src/components/chat/ChatMessage.tsx` ✅ (nouveau)
- `packages/web-app/src/components/chat/ChatInput.tsx` ✅ (nouveau)
- `packages/web-app/src/app/(dashboard)/messages/page.tsx` ✅ (nouveau)
- `packages/web-app/src/components/layout/Header.tsx` ✅ (modifié)

---

## Phase 6: Types Partagés ✅ TERMINÉE

### Tâches
- [x] 6.1 Créer `notification.ts` avec tous les types de notifications
- [x] 6.2 Créer `chat.ts` avec interfaces ChatRoom, ChatMessage, WSMessage
- [x] 6.3 Exporter tous les types depuis index.ts

### Fichiers créés/modifiés
- `packages/shared/src/types/notification.ts` ✅ (nouveau)
- `packages/shared/src/types/chat.ts` ✅ (nouveau)
- `packages/shared/src/types/index.ts` ✅ (modifié)

---

## Spécifications Techniques

### Style iMessage - UI Chat

```
┌─────────────────────────────────────┐
│  ← Foot entre collègues             │  Header avec nom activité
├─────────────────────────────────────┤
│                                     │
│  [Avatar] Message reçu              │  Bulle grise alignée gauche
│           12:34                     │
│                                     │
│              Mon message envoyé [A] │  Bulle bleue alignée droite
│                             12:35   │
│                                     │
│  [Avatar] Autre message             │
│           12:36                     │
│                                     │
├─────────────────────────────────────┤
│  [       Écrivez un message...    ] │  Input + bouton envoi
└─────────────────────────────────────┘
```

- Bulles arrondies avec queue
- Messages groupés par sender (pas de répétition avatar)
- Timestamps discrets
- Indicateur si message modéré (contenu filtré)

### Modération - Dictionnaire Français

Bibliothèque : `obscenity` avec dataset personnalisé français incluant :
- Insultes courantes et variantes
- Termes discriminatoires
- Leetspeak (m3rd3, etc.)
- Action : remplacer par `***` et flag `isModerated: true`

---

## Tests à effectuer

### Tests manuels
1. **Notifications** :
   - Créer une session → vérifier notification "nouvelles sessions"
   - Atteindre minPlayers → vérifier notification "session confirmée"
   - Annuler session → vérifier notification "session annulée"
   - Sélectionner plusieurs notifications → supprimer en lot

2. **Chat** :
   - S'inscrire à une activité → salon apparaît dans /messages
   - Envoyer un message → apparaît en temps réel pour autres membres
   - Tester un gros mot → vérifier filtrage
   - Fermer/rouvrir page → messages persistés

### Tests automatisés
- Tests unitaires services backend (Jest)
- Tests E2E chat et notifications (Playwright)

---

## Dépendances installées

```bash
# Backend (déjà installées)
@fastify/websocket
obscenity
```

---

## Corrections et Ajustements

### 2026-01-20: Fix patterns de modération
**Problème**: Erreur de syntaxe dans `moderation.service.ts` avec les patterns `[?\s]` (ex: `pattern fils[?\s]de[?\s]pute`)

**Cause**: La bibliothèque `obscenity` ne supporte pas la syntaxe regex `[?\s]` pour les espaces optionnels dans les patterns.

**Solution**: Remplacement par des patterns séparés pour couvrir les variantes avec et sans espaces:
```typescript
// Avant (❌ invalide)
pattern`fils[?\s]de[?\s]pute`

// Après (✅ valide)
pattern`fils de pute`,
pattern`filsdepute`,
```

**Fichier modifié**: `packages/backend/src/services/moderation.service.ts`

### 2026-01-20: Fix glitch notifications (apparition/disparition en boucle)
**Problème**: Dans la page `/notifications`, les notifications apparaissaient puis disparaissaient en permanence, créant un effet de glitch.

**Cause**: Boucle infinie de re-renders causée par la création d'un nouvel objet `{ unreadOnly: filter === 'unread' }` à chaque render. Chaque nouvel objet avait une référence différente, déclenchant le `useCallback` de `fetchNotifications`, qui déclenchait le `useEffect`, qui changeait le state, créant un nouveau render.

**Solution**: Utilisation de `useMemo` pour mémoriser l'objet filters:
```typescript
// Avant (❌ boucle infinie)
const { notifications } = useNotifications({ unreadOnly: filter === 'unread' })

// Après (✅ stable)
const filters = useMemo(() => ({
  unreadOnly: filter === 'unread'
}), [filter])
const { notifications } = useNotifications(filters)
```

**Fichier modifié**: `packages/web-app/src/app/(dashboard)/notifications/page.tsx`

### 2026-01-20: Création automatique des salons de chat manquants
**Problème**: Les utilisateurs inscrits à des activités ne voyaient pas les salons de chat correspondants dans `/messages`.

**Cause**: La méthode `getUserRooms` filtrait uniquement les activités ayant déjà un `chatRoom`, mais les salons n'étaient créés que par un appel explicite à `getOrCreateRoom` (via l'endpoint `/api/chat/activity/:activityId/room`). Les salons n'étaient donc jamais créés automatiquement lors de l'inscription à une activité.

**Solution**: Modification de `ChatService.getUserRooms()` pour créer automatiquement les salons manquants:
```typescript
// Avant: filtrait les activités sans salon
const rooms = activities
  .filter(activity => activity.chatRoom)
  .map(...)

// Après: crée les salons manquants
const roomPromises = activities.map(async (activity) => {
  let chatRoom = activity.chatRoom
  if (!chatRoom) {
    chatRoom = await prisma.chatRoom.create({
      data: { activityId: activity.id }
    })
  }
  return { ... }
})
```

**Fichier modifié**: `packages/backend/src/services/chat.service.ts`

### 2026-01-20: Remplacement de tsx watch par nodemon
**Problème**: `tsx watch` atteignait la limite système de file watchers (ENOSPC error) sur Linux avec limite de 60711 watchers.

**Cause**: `tsx watch` surveille trop de fichiers dans node_modules malgré les flags --ignore.

**Solution**: Installation et configuration de `nodemon` qui gère mieux les file watchers:
```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts", "node_modules"],
  "exec": "tsx src/index.ts"
}
```

**Scripts mis à jour**:
- `npm run dev` → utilise nodemon (recommandé)
- `npm run dev:tsx` → utilise tsx watch (nécessite augmentation limite système)
- `npm run dev:no-watch` → exécution sans auto-reload

**Fichiers modifiés**:
- `packages/backend/package.json`
- `packages/backend/nodemon.json` (nouveau)

---

## ✅ RÉCAPITULATIF COMPLET

### Backend (Phases 1-3)
**18 fichiers créés/modifiés**

#### Base de données
- Schema Prisma étendu avec 3 nouveaux modèles (ChatRoom, ChatMessage, ChatRoomReadStatus)
- 4 nouveaux types de notifications (session_confirmed, session_cancelled, etc.)
- Relations entre Activity, Notification, Session et Chat

#### Services & Routes
- `notification.service.ts` - CRUD notifications + notifications automatiques
- `moderation.service.ts` - Filtrage français avec `obscenity`
- `chat.service.ts` - Gestion salons, messages, compteurs non lus
- `notifications.routes.ts` - 6 endpoints REST
- `chat.routes.ts` - 7 endpoints REST

#### WebSocket
- `/ws/chat/:roomId` - Chat temps réel avec typing indicators
- `/ws/notifications` - Notifications temps réel
- Broadcast aux membres, reconnexion automatique

#### Jobs
- `reminder.job.ts` - Rappels automatiques 24h avant les sessions

### Frontend (Phases 4-5)
**14 fichiers créés/modifiés**

#### Hooks
- `useNotifications.ts` - WebSocket + sélection multiple + CRUD
- `useChat.ts` - WebSocket salon + messages + typing
- `useChatRooms.ts` - Liste salons + compteurs non lus

#### Composants Chat
- `ChatMessage.tsx` - Bulles iMessage (gauche/droite)
- `ChatInput.tsx` - Zone saisie auto-resize
- `ChatRoom.tsx` - Vue conversation complète
- `ChatRoomList.tsx` - Liste salons avec badges

#### Pages
- `/notifications` - Sélection multiple, actions en lot, filtres
- `/messages` - Split layout desktop, navigation mobile

#### Header
- Badge dynamique notifications (WebSocket)
- Badge dynamique messages (polling)

### Types Partagés (Phase 6)
**3 fichiers créés/modifiés**
- `notification.ts` - 14 types + interfaces
- `chat.ts` - ChatRoom, ChatMessage, WSMessage, etc.
- `index.ts` - Exports centralisés

---

## Comment lancer l'application

### Backend
```bash
cd packages/backend
npm run dev
# Backend disponible sur http://localhost:3001
# WebSocket sur ws://localhost:3001
```

### Frontend
```bash
cd packages/web-app
npm run dev
# Frontend disponible sur http://localhost:3000
```

### Tests manuels recommandés
1. Créer une session → vérifier notification "nouvelles sessions"
2. S'inscrire à plusieurs → atteindre minPlayers → vérifier "session confirmée"
3. Annuler session → vérifier "session annulée"
4. Sélectionner plusieurs notifications → supprimer en lot
5. S'inscrire à une activité → vérifier que salon apparaît dans /messages
6. Envoyer message → vérifier temps réel
7. Tester gros mot → vérifier filtrage
