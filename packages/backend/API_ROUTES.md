# API Routes Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: `https://api.stepzy.com`

## Authentication
Toutes les routes (sauf `/health` et `/api/auth/*`) nécessitent une authentification via cookie de session Better-auth.

---

## 🏥 Health & Info

### GET /health
Status du serveur
- **Auth**: Non requis
- **Response**: `{ status: 'ok', timestamp: string, uptime: number }`

### GET /api
Information API
- **Auth**: Non requis
- **Response**: `{ name: string, version: string, endpoints: object }`

---

## 🔐 Authentication (Better-auth)

### POST /api/auth/sign-in/email
Connexion utilisateur
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: User, session: Session }`

### POST /api/auth/sign-up/email
Inscription utilisateur
- **Body**: `{ email: string, password: string, pseudo: string }`
- **Response**: `{ user: User, session: Session }`

### POST /api/auth/sign-out
Déconnexion
- **Response**: `{ success: true }`

### GET /api/auth/session
Obtenir session actuelle
- **Response**: `{ user: User, session: Session }`

---

## 🎯 Activities

### GET /api/activities
Liste des activités avec filtres
- **Auth**: Requis
- **Query params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10, max: 100)
  - `sport` (SportType, optional)
  - `createdBy` (string, optional)
  - `isPublic` (boolean, optional)
  - `recurringType` ('weekly' | 'monthly', optional)
- **Response**: `{ success: true, data: { activities: Activity[], pagination: Pagination } }`

### POST /api/activities
Créer une nouvelle activité
- **Auth**: Requis
- **Body**: `CreateActivityData`
  ```json
  {
    "name": "Football du mardi",
    "description": "Match hebdomadaire",
    "sport": "football",
    "minPlayers": 8,
    "maxPlayers": 12,
    "recurringDays": ["tuesday"],
    "recurringType": "weekly",
    "startTime": "19:00",
    "endTime": "21:00"
  }
  ```
- **Response**: `{ success: true, data: Activity, message: string }`

### GET /api/activities/:id
Détail d'une activité
- **Auth**: Requis
- **Response**: `{ success: true, data: Activity }`

### PUT /api/activities/:id
Modifier une activité (créateur uniquement)
- **Auth**: Requis (créateur)
- **Body**: `UpdateActivityData` (champs optionnels)
- **Response**: `{ success: true, data: Activity, message: string }`

### DELETE /api/activities/:id
Supprimer une activité (créateur uniquement)
- **Auth**: Requis (créateur)
- **Response**: `{ success: true, message: string }`

### POST /api/activities/:id/subscribe
S'abonner à une activité
- **Auth**: Requis
- **Response**: `{ success: true, message: string }`

### DELETE /api/activities/:id/subscribe
Se désabonner d'une activité
- **Auth**: Requis
- **Response**: `{ success: true, message: string }`

### GET /api/activities/my-created
Mes activités créées
- **Auth**: Requis
- **Response**: `{ success: true, data: Activity[] }`

### GET /api/activities/my-participations
Mes participations
- **Auth**: Requis
- **Response**: `{ success: true, data: Activity[] }`

### GET /api/activities/upcoming-sessions
Sessions à venir des activités auxquelles l'utilisateur est abonné
- **Auth**: Requis
- **Response**: `{ success: true, data: Session[] }`
- **Note**: Filtre automatiquement par les activités auxquelles l'utilisateur est abonné via ActivitySubscription
- **Note**: Exclut les sessions où l'utilisateur participe déjà

---

## 📅 Sessions

### GET /api/sessions/:id
Détail d'une session
- **Auth**: Requis
- **Response**: `{ success: true, data: Session }`

### PUT /api/sessions/:id
Modifier une session (créateur activité uniquement)
- **Auth**: Requis
- **Body**: `{ maxPlayers?: number, isCancelled?: boolean }`
- **Response**: `{ success: true, data: Session, message: string }`

### POST /api/sessions/:id/join
Rejoindre une session
- **Auth**: Requis
- **Response**: `{ success: true, data: Participant, message: string }`
- **Note**: Status 'confirmed' si places disponibles, sinon 'waiting'

### POST /api/sessions/:id/leave
Quitter une session
- **Auth**: Requis
- **Response**: `{ success: true, message: string }`
- **Note**: Promotion automatique liste d'attente si participant confirmé quitte

---

## 👤 Users

### GET /api/users/me
Mon profil utilisateur
- **Auth**: Requis
- **Response**: `{ success: true, data: { user: User } }`

### GET /api/users/:id
Profil utilisateur par ID
- **Auth**: Requis
- **Response**: `{ success: true, data: { user: User } }`

### PUT /api/users/profile
Modifier mon profil
- **Auth**: Requis
- **Body**: `{ pseudo: string, email: string, avatar?: string }`
- **Response**: `{ success: true, data: { user: User }, message: string }`

### GET /api/users/:id/stats
Statistiques utilisateur
- **Auth**: Requis (soi-même ou admin)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalSessions": 42,
        "completedSessions": 38,
        "cancelledSessions": 2,
        "activeSessions": 5,
        "attendanceRate": 90,
        "favoriteTime": "19:00",
        "currentStreak": 3,
        "longestStreak": 7
      }
    }
  }
  ```

### GET /api/users/:id/activities
Activités d'un utilisateur
- **Auth**: Requis (soi-même ou admin)
- **Response**: `{ success: true, data: { sessions: Session[] } }`

### PUT /api/users/preferences
Modifier mes préférences
- **Auth**: Requis
- **Body**: `{ notifications?: boolean, emailNotifications?: boolean, theme?: 'light'|'dark'|'auto' }`
- **Response**: `{ success: true, data: Preferences, message: string }`

---

## 🛡️ Admin (Root role required)

### GET /api/admin/users
Liste tous les utilisateurs
- **Auth**: Requis (admin)
- **Query params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `search` (string, optional)
  - `role` ('user' | 'root', optional)
- **Response**: `{ success: true, data: { users: User[], pagination: Pagination } }`

### GET /api/admin/users/:id
Détail utilisateur
- **Auth**: Requis (admin)
- **Response**: `{ success: true, data: { user: User } }`

### PUT /api/admin/users/:id
Modifier utilisateur
- **Auth**: Requis (admin)
- **Body**: `{ pseudo?: string, email?: string, role?: 'user'|'root', avatar?: string }`
- **Response**: `{ success: true, data: { user: User }, message: string }`

### DELETE /api/admin/users/:id
Supprimer utilisateur
- **Auth**: Requis (admin)
- **Response**: `{ success: true, message: string }`
- **Note**: Admin ne peut pas se supprimer lui-même

### GET /api/admin/statistics
Statistiques plateforme
- **Auth**: Requis (admin)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalUsers": 150,
        "totalActivities": 45,
        "totalSessions": 320,
        "totalParticipations": 1250,
        "activeUsers": 78,
        "recentActivities": 12
      },
      "breakdown": {
        "usersByRole": [...],
        "activitiesBySport": [...],
        "sessionsByStatus": [...]
      }
    }
  }
  ```

### GET /api/admin/activity-logs
Logs d'activité récents
- **Auth**: Requis (admin)
- **Query params**: `limit` (number, default: 50)
- **Response**: `{ success: true, data: { recentSessions: [], recentParticipations: [] } }`

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful" // optionnel
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ] // optionnel (validation errors)
}
```

### Pagination
```json
{
  "page": 1,
  "limit": 10,
  "totalCount": 50,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

---

## 🔒 Authorization

### Middleware Chain
1. **requireAuth**: Vérifie session Better-auth
2. **requireAdmin**: Vérifie role === 'root'
3. **requireAdminOrOwner**: Vérifie admin OU propriétaire de la ressource

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (non authentifié)
- `403` - Forbidden (non autorisé)
- `404` - Not Found
- `500` - Internal Server Error
