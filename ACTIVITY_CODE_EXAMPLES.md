# 📚 Exemples d'Utilisation - Système de Codes d'Activité

Ce document présente des exemples concrets d'utilisation du système de codes d'activité.

---

## 🎯 Scénarios d'utilisation

### 1. Créer une activité et obtenir le code

```typescript
// Frontend: Créer une activité
const createActivity = async () => {
  const result = await activitiesApi.create({
    name: "Football du vendredi",
    description: "Match de foot entre amis",
    sport: "football",
    minPlayers: 8,
    maxPlayers: 12,
    recurringDays: ["friday"],
    recurringType: "weekly",
    startTime: "19:00",
    endTime: "21:00"
  })

  if (result.success) {
    const activityCode = result.data.code
    console.log(`Code d'activité : ${activityCode}`)
    // Exemple: "A1B2C3D4"
  }
}
```

### 2. Partager le code avec des amis

#### Option A: Copier le code dans le presse-papier

```typescript
// Frontend: Copier le code
const shareCode = async (code: string) => {
  const success = await activitiesApi.copyCodeToClipboard(code)

  if (success) {
    alert('Code copié ! Partagez-le avec vos amis.')
  }
}

// Usage
shareCode("A1B2C3D4")
```

#### Option B: Générer un lien d'invitation

```typescript
// Frontend: Générer lien
const shareLink = (code: string) => {
  const link = activitiesApi.generateShareLink(code)
  // Retourne: "http://localhost:3000/join/A1B2C3D4"

  // Copier le lien
  navigator.clipboard.writeText(link)
}
```

#### Option C: Envoyer par email

```typescript
// Frontend: Inviter par email
const inviteByEmail = async (activityId: string, email: string) => {
  const result = await activitiesApi.sendInvitation(activityId, email)

  if (result.success) {
    alert(`Invitation envoyée à ${email}`)
  }
}

// Usage
inviteByEmail("activity_123", "ami@example.com")
```

### 3. Rejoindre une activité avec un code

#### Via le composant JoinByCodeCard

```tsx
// Frontend: Utiliser le composant
import { JoinByCodeCard } from '@/components/activities/JoinByCodeCard'

function MyPage() {
  const { joinByCode } = useActivities(userId)

  return (
    <JoinByCodeCard onJoin={joinByCode} />
  )
}
```

#### Via un appel API direct

```typescript
// Frontend: Rejoindre directement
const joinActivity = async (code: string) => {
  const result = await activitiesApi.joinByCode(code)

  if (result.success) {
    if (result.data?.alreadyMember) {
      console.log('Vous êtes déjà membre de cette activité')
    } else {
      console.log(`Activité "${result.data?.name}" rejointe !`)
    }
  } else {
    console.error(result.error) // "Code invalide" ou autre erreur
  }
}

// Usage
joinActivity("A1B2C3D4")
```

### 4. Prévisualiser une activité avant de rejoindre

```typescript
// Frontend: Obtenir les infos sans rejoindre
const previewActivity = async (code: string) => {
  const result = await activitiesApi.getByCode(code)

  if (result.success) {
    const activity = result.data
    console.log(`Nom: ${activity.name}`)
    console.log(`Sport: ${activity.sport}`)
    console.log(`Créateur: ${activity.creator.pseudo}`)
    console.log(`Joueurs: ${activity.minPlayers}-${activity.maxPlayers}`)
    console.log(`Récurrence: ${activity.recurringType}`)
    console.log(`Jours: ${activity.recurringDays.join(', ')}`)
  }
}

// Usage
previewActivity("A1B2C3D4")
```

### 5. Valider un code côté client

```typescript
import { sanitizeActivityCode, isValidActivityCode, formatActivityCode } from '@stepzy/shared'

// Nettoyer l'input utilisateur
const userInput = "a1b2 c3d4"
const cleanCode = sanitizeActivityCode(userInput)
// Résultat: "A1B2C3D4"

// Valider le format
if (isValidActivityCode(cleanCode)) {
  console.log('Code valide')
} else {
  console.log('Code invalide - doit être 8 caractères A-Z0-9')
}

// Formater pour l'affichage
const formatted = formatActivityCode(cleanCode)
// Résultat: "A1B2 C3D4"
```

---

## 🔧 Cas d'usage Backend

### 1. Générer un code unique

```typescript
import { generateActivityCode } from '@stepzy/shared'

// Générer un code
const code = generateActivityCode()
console.log(code) // Ex: "X7Y9Z2W1"

// Le code est automatiquement généré à la création d'activité
const activity = await prisma.activity.create({
  data: {
    name: "Volleyball",
    sport: "volley",
    // ... autres champs
    code: generateActivityCode() // Généré automatiquement
  }
})
```

### 2. Vérifier si un utilisateur est déjà membre

```typescript
// Backend: Service
async joinByCode(userId: string, code: string) {
  const activity = await prisma.activity.findUnique({
    where: { code },
    include: { subscriptions: true }
  })

  if (!activity) {
    throw new Error('Code d\'activité invalide')
  }

  // Vérifier si déjà membre
  const existingSubscription = activity.subscriptions.find(
    sub => sub.userId === userId
  )

  if (existingSubscription) {
    return {
      activity,
      alreadyMember: true
    }
  }

  // Créer l'abonnement
  await prisma.activitySubscription.create({
    data: {
      userId,
      activityId: activity.id
    }
  })

  return {
    activity,
    alreadyMember: false
  }
}
```

### 3. Envoyer une invitation par email

```typescript
// Backend: Email Service
import { render } from '@react-email/render'
import { ActivityInvitationEmail } from '../emails/ActivityInvitationEmail'

async sendActivityInvitation(email: string, data: EmailData) {
  const emailHtml = render(
    ActivityInvitationEmail({
      activityName: data.activityName,
      sportName: data.sportName,
      creatorName: data.creatorName,
      activityCode: data.activityCode,
      inviteLink: data.inviteLink,
      recurringDays: data.recurringDays,
      recurringType: data.recurringType,
      startTime: data.startTime,
      endTime: data.endTime,
      maxPlayers: data.maxPlayers
    })
  )

  const result = await transporter.sendMail({
    from: '"Stepzy" <noreply@stepzy.com>',
    to: email,
    subject: `Invitation - ${data.activityName}`,
    html: emailHtml
  })

  return {
    success: true,
    messageId: result.messageId
  }
}
```

---

## 🎨 Exemples Frontend avec React

### Composant personnalisé de saisie de code

```tsx
'use client'

import { useState } from 'react'
import { sanitizeActivityCode, isValidActivityCode } from '@stepzy/shared'

export function CodeInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (value: string) => {
    const sanitized = sanitizeActivityCode(value)
    setCode(sanitized.slice(0, 8))
    setError(null)
  }

  const handleSubmit = () => {
    if (!isValidActivityCode(code)) {
      setError('Code invalide (8 caractères A-Z0-9)')
      return
    }

    onSubmit(code)
  }

  return (
    <div>
      <input
        type="text"
        value={code}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="A1B2C3D4"
        maxLength={8}
        className="uppercase"
      />
      {error && <p className="text-red-600">{error}</p>}
      <button onClick={handleSubmit} disabled={code.length !== 8}>
        Vérifier
      </button>
    </div>
  )
}
```

### Hook personnalisé pour gérer les codes

```typescript
import { useState } from 'react'
import { activitiesApi } from '@/lib/api'

export function useActivityCode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinByCode = async (code: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await activitiesApi.joinByCode(code)

      if (result.success) {
        return {
          success: true,
          activity: result.data,
          alreadyMember: result.data?.alreadyMember
        }
      } else {
        setError(result.error || 'Erreur')
        return { success: false }
      }
    } catch (err) {
      setError('Erreur de connexion')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const previewCode = async (code: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await activitiesApi.getByCode(code)

      if (result.success) {
        return {
          success: true,
          activity: result.data
        }
      } else {
        setError(result.error || 'Code invalide')
        return { success: false }
      }
    } catch (err) {
      setError('Erreur de connexion')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    joinByCode,
    previewCode
  }
}
```

---

## 🧪 Exemples de Tests

### Test de validation de code

```typescript
import { isValidActivityCode, sanitizeActivityCode } from '@stepzy/shared'

describe('Activity Code Validation', () => {
  it('should validate correct codes', () => {
    expect(isValidActivityCode('A1B2C3D4')).toBe(true)
    expect(isValidActivityCode('12345678')).toBe(true)
    expect(isValidActivityCode('ABCDEFGH')).toBe(true)
  })

  it('should reject invalid codes', () => {
    expect(isValidActivityCode('abc123')).toBe(false) // trop court
    expect(isValidActivityCode('a1b2c3d4')).toBe(false) // minuscules
    expect(isValidActivityCode('A1B2-C3D4')).toBe(false) // caractères spéciaux
  })

  it('should sanitize user input', () => {
    expect(sanitizeActivityCode('a1b2 c3d4')).toBe('A1B2C3D4')
    expect(sanitizeActivityCode('  abc  ')).toBe('ABC')
  })
})
```

### Test API

```typescript
import { activitiesApi } from '@/lib/api'

describe('Join by Code API', () => {
  it('should join activity with valid code', async () => {
    const result = await activitiesApi.joinByCode('A1B2C3D4')

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('name')
    expect(result.data.alreadyMember).toBe(false)
  })

  it('should return error for invalid code', async () => {
    const result = await activitiesApi.joinByCode('INVALID1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('invalide')
  })
})
```

---

## 📖 Bonnes Pratiques

### 1. **Validation côté client ET serveur**
```typescript
// Toujours valider côté client pour UX
if (!isValidActivityCode(code)) {
  showError('Format invalide')
  return
}

// ET côté serveur pour sécurité
// (déjà implémenté via Zod dans les routes)
```

### 2. **Feedback utilisateur clair**
```typescript
// Afficher des messages spécifiques
if (result.data?.alreadyMember) {
  toast.info('Vous êtes déjà membre de cette activité')
} else {
  toast.success('Activité rejointe avec succès !')
}
```

### 3. **Gestion d'erreurs robuste**
```typescript
try {
  const result = await activitiesApi.joinByCode(code)
  // ...
} catch (error) {
  if (error.status === 404) {
    showError('Code invalide')
  } else if (error.status === 401) {
    redirectToLogin()
  } else {
    showError('Erreur de connexion')
  }
}
```

### 4. **Prévisualisation avant rejoindre**
```typescript
// Toujours montrer un aperçu avant de rejoindre
const preview = await activitiesApi.getByCode(code)
// Afficher les détails...
// Puis demander confirmation
if (confirm(`Rejoindre "${preview.data.name}" ?`)) {
  await activitiesApi.joinByCode(code)
}
```

---

**Dernière mise à jour** : 2025-11-01
