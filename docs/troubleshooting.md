# 🔧 Guide de Dépannage - Futsal Reservation SaaS

Guide technique pour diagnostiquer et résoudre les problèmes courants de l'application.

## 📋 Table des matières

- [Diagnostic rapide](#-diagnostic-rapide)
- [Problèmes d'authentification](#-problèmes-dauthentification)
- [Problèmes d'inscription matches](#-problèmes-dinscription-matches)
- [Performance et lenteurs](#-performance-et-lenteurs)
- [Problèmes de notifications](#-problèmes-de-notifications)
- [Erreurs JavaScript](#-erreurs-javascript)
- [Problèmes base de données](#-problèmes-base-de-données)
- [Problèmes de cache](#-problèmes-de-cache)
- [Monitoring et logs](#-monitoring-et-logs)

---

## 🚨 Diagnostic rapide

### Checklist système (30 secondes)

```bash
# 1. Santé générale
curl -s http://localhost:3000/api/health | jq

# 2. Status des services
docker ps
# ou
pm2 status

# 3. Logs récents
tail -n 20 /var/log/futsal/app.log

# 4. Espace disque
df -h

# 5. Mémoire et CPU
top -n 1 | head -20
```

### Codes de réponse HTTP

| Code | Signification | Action immédiate |
|------|---------------|------------------|
| **200** | ✅ OK | Aucune |
| **401** | 🔐 Non authentifié | Vérifier session/token |
| **403** | ⛔ Accès refusé | Vérifier permissions |
| **404** | 🔍 Ressource introuvable | Vérifier route/ID |
| **429** | 🚦 Rate limit dépassé | Attendre ou ajuster limites |
| **500** | 💥 Erreur serveur | Consulter logs application |
| **502** | 🔌 Gateway error | Vérifier proxy/load balancer |
| **503** | 🚧 Service indisponible | Redémarrer services |

### URLs de diagnostic

- **Health check** : `http://localhost:3000/api/health`
- **Metrics** : `http://localhost:3000/api/metrics`
- **Version** : `http://localhost:3000/api/version`

---

## 🔐 Problèmes d'authentification

### "Authentication required" (401)

**Diagnostic** :
```bash
# Vérifier session en cours
curl -b "session=TOKEN_VALUE" http://localhost:3000/api/auth/me

# Vérifier cookies dans navigateur
# Dev Tools > Application > Cookies > localhost:3000
```

**Causes possibles** :
- Session expirée (>7 jours)
- Cookie supprimé/corrompu
- Serveur redémarré (sessions perdues)
- Configuration Better-auth incorrecte

**Solutions** :
1. **Reconnexion utilisateur** - Solution immédiate
2. **Vérifier config auth** :
   ```typescript
   // Vérifier src/lib/auth/config.ts
   sessionMaxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
   ```
3. **Nettoyer sessions expirées** :
   ```sql
   DELETE FROM sessions WHERE "expiresAt" < NOW();
   ```

### "Too many requests" (429) sur login

**Diagnostic** :
```bash
# Vérifier logs rate limiting
grep "rate_limit" /var/log/futsal/app.log | tail -10
```

**Configuration actuelle** :
- Login : 5 tentatives/minute
- Register : 3 tentatives/minute

**Solutions** :
1. **Temporaire** : Attendre 1 minute
2. **Ajuster limites** si légitimes :
   ```typescript
   // src/lib/middleware/rateLimit.ts
   login: { windowMs: 60000, max: 10 } // Augmenter à 10
   ```

### Sessions perdues après redémarrage

**Cause** : Sessions stockées en base mais cache mémoire vidé.

**Solution** :
```typescript
// Vérifier configuration session Redis
// src/lib/auth/config.ts
session: {
  store: redisStore, // Utiliser Redis, pas mémoire
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}
```

---

## ⚽ Problèmes d'inscription matches

### "Match not found" (404)

**Diagnostic** :
```sql
-- Vérifier existence match
SELECT id, date, status FROM matches WHERE id = 'MATCH_ID';

-- Vérifier contraintes de date
SELECT * FROM matches WHERE date < NOW() + interval '2 weeks';
```

**Causes** :
- Match supprimé/annulé
- ID incorrect dans URL
- Contraintes temporelles (>2 semaines)

### "Match is full" mais des places semblent libres

**Diagnostic** :
```sql
-- Compter vrais joueurs inscrits
SELECT 
  m.id, 
  m.maxPlayers,
  COUNT(mp.*) as registered_count
FROM matches m
LEFT JOIN match_players mp ON m.id = mp.matchId 
  AND mp.status = 'registered'
WHERE m.id = 'MATCH_ID'
GROUP BY m.id, m.maxPlayers;
```

**Causes possibles** :
- Cache obsolète
- Transaction non committée
- Status match incohérent

**Solution** :
```typescript
// Forcer recalcul status match
export async function recalculateMatchStatus(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      _count: {
        select: {
          players: { where: { status: 'registered' } }
        }
      }
    }
  })
  
  const newStatus = match._count.players >= match.maxPlayers ? 'full' : 'open'
  
  await prisma.match.update({
    where: { id: matchId },
    data: { status: newStatus }
  })
}
```

### Inscriptions doubles détectées

**Diagnostic** :
```sql
-- Détecter doublons
SELECT userId, matchId, COUNT(*) as count
FROM match_players 
GROUP BY userId, matchId 
HAVING COUNT(*) > 1;
```

**Solution** :
```sql
-- Nettoyer doublons (garder plus récent)
WITH ranked_players AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY userId, matchId 
      ORDER BY joinedAt DESC
    ) as rn
  FROM match_players
)
DELETE FROM match_players 
WHERE id IN (
  SELECT id FROM ranked_players WHERE rn > 1
);
```

---

## 🐌 Performance et lenteurs

### API response time > 200ms

**Diagnostic temps réponse** :
```bash
# Test endpoint spécifique
curl -w "@curl-format.txt" -o /dev/null http://localhost:3000/api/matches

# Contenu curl-format.txt:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

**Identifier requêtes lentes** :
```sql
-- PostgreSQL slow queries (>100ms)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Optimisations courantes** :

1. **Cache Redis manquant** :
   ```typescript
   // Vérifier hit rate cache
   const cacheStats = await redis.info('stats')
   console.log('Cache hit rate:', cacheStats.keyspace_hits / (cacheStats.keyspace_hits + cacheStats.keyspace_misses))
   ```

2. **Requêtes N+1** :
   ```typescript
   // ❌ N+1 problem
   const matches = await prisma.match.findMany()
   for (const match of matches) {
     const players = await prisma.matchPlayer.findMany({ where: { matchId: match.id }})
   }

   // ✅ Solution avec include
   const matches = await prisma.match.findMany({
     include: { players: true }
   })
   ```

### Interface utilisateur lente

**Diagnostic côté client** :
```javascript
// Console navigateur
performance.getEntriesByType('navigation')[0].loadEventEnd
// Temps chargement page en ms

// Analyser bundles JavaScript
npm run analyze # Si webpack-bundle-analyzer configuré
```

**Solutions** :
1. **Code splitting** :
   ```typescript
   // Lazy loading composants
   const AdminPanel = lazy(() => import('./AdminPanel'))
   ```

2. **Images optimisées** :
   ```typescript
   // Next.js Image avec optimisation
   import Image from 'next/image'
   <Image src={avatar} width={40} height={40} alt="Avatar" />
   ```

---

## 🔔 Problèmes de notifications

### Emails non reçus

**Diagnostic SMTP** :
```bash
# Tester configuration email
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransporter({
  // Config SMTP
});
transport.verify().then(console.log).catch(console.error);
"
```

**Checklist email** :
- [ ] Configuration SMTP correcte
- [ ] Credentials valides
- [ ] Domaine expéditeur vérifié (SPF, DKIM)
- [ ] Rate limits respectés
- [ ] Templates email valides

### Push notifications non reçues

**Diagnostic navigateur** :
```javascript
// Console navigateur
Notification.permission // "granted", "denied", "default"

// Tester notification manuelle
if (Notification.permission === "granted") {
  new Notification("Test", { body: "Notification test" })
}
```

**Vérifications** :
1. **Permission accordée** : Utilisateur a accepté
2. **Service Worker** : Registré correctement  
3. **HTTPS** : Requis pour push notifications
4. **Payload size** : <4KB pour compatibilité

### Notifications en double

**Diagnostic** :
```sql
-- Chercher doublons récents
SELECT type, userId, COUNT(*) as count
FROM notifications 
WHERE "createdAt" > NOW() - interval '1 hour'
GROUP BY type, userId 
HAVING COUNT(*) > 1;
```

**Causes** :
- Retry logique défaillante
- Tâches cron qui se chevauchent
- Race conditions

**Solution** :
```typescript
// Déduplication avec clé unique
export async function sendNotification(data: NotificationData) {
  const dedupeKey = `${data.type}_${data.userId}_${data.matchId}`
  
  // Vérifier si déjà envoyée récemment
  const existing = await redis.get(`notif:${dedupeKey}`)
  if (existing) return false
  
  // Créer notification
  const notification = await createNotification(data)
  
  // Cache 1h pour éviter doublons
  await redis.setex(`notif:${dedupeKey}`, 3600, 'sent')
  
  return notification
}
```

---

## 🚫 Erreurs JavaScript

### "TypeError: Cannot read property of undefined"

**Diagnostic** :
```javascript
// Console navigateur - Stack trace complète
console.trace()

// Breakpoints conditionnels
if (user === undefined) debugger;
```

**Causes courantes** :
1. **Race condition** : Composant rendu avant données chargées
2. **API response** : Structure différente d'attendue
3. **Props manquantes** : Composant sans props requises

**Solutions** :
```typescript
// ✅ Guards defensifs
const UserProfile = ({ user }) => {
  if (!user) return <div>Chargement...</div>
  
  return (
    <div>
      <h1>{user.pseudo}</h1>
      <p>{user.email}</p>
    </div>
  )
}

// ✅ Optional chaining
const avatar = user?.profile?.avatar || '/default-avatar.png'
```

### "ReferenceError: X is not defined"

**Diagnostic** :
```bash
# Vérifier imports/exports
grep -r "export.*X" src/
grep -r "import.*X" src/
```

**Solutions** :
1. **Import manquant** :
   ```typescript
   import { createUser } from '@/lib/auth/service'
   ```

2. **Export incorrect** :
   ```typescript
   // ❌ Default export utilisé comme named export
   import createUser from './service' // Faux si export { createUser }
   
   // ✅ Correct
   import { createUser } from './service'
   ```

### Hydration mismatch (Next.js)

**Erreur** : "Text content does not match server-rendered HTML"

**Diagnostic** :
```typescript
// Identifier différences SSR/Client
useEffect(() => {
  console.log('Client render:', document.body.innerHTML.slice(0, 100))
}, [])
```

**Solutions** :
```typescript
// ✅ Données côté client uniquement
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return null

// ✅ suppressHydrationWarning pour contenus dynamiques
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

---

## 🗃️ Problèmes base de données

### Connection timeout

**Diagnostic** :
```bash
# Connexions actives PostgreSQL
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Connexions Prisma
npm run prisma studio # Vérifier connexion
```

**Solutions** :
1. **Pool de connexions** :
   ```typescript
   // prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
     binaryTargets = ["native"]
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     // Connection pooling
     pool_min_conns = 5
     pool_max_conns = 20
   }
   ```

2. **Fermer connexions inutiles** :
   ```typescript
   // Graceful shutdown
   process.on('beforeExit', async () => {
     await prisma.$disconnect()
   })
   ```

### Migration failed

**Diagnostic** :
```bash
# Status migrations
npx prisma migrate status

# Logs migration
cat .migrate/migration_lock.toml
```

**Solutions** :
1. **Migration interrompue** :
   ```bash
   # Marquer comme appliquée si déjà en DB
   npx prisma migrate resolve --applied "20240115_migration_name"
   
   # Ou rollback
   npx prisma migrate reset # ⚠️ Perte de données
   ```

2. **Schema drift** :
   ```bash
   # Réinitialiser à partir du schema
   npx prisma db push --force-reset
   ```

### Deadlock détecté

**Erreur** : "deadlock detected"

**Diagnostic** :
```sql
-- Identifier locks actifs
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions** :
1. **Ordre des locks** cohérent :
   ```typescript
   // ✅ Toujours locker dans même ordre
   const result = await prisma.$transaction([
     prisma.match.update({ where: { id: matchId }}),
     prisma.matchPlayer.create({ data: playerData })
   ])
   ```

2. **Transactions courtes** :
   ```typescript
   // ❌ Transaction trop longue
   await prisma.$transaction(async (tx) => {
     // Beaucoup d'opérations...
     await heavyComputation() // 30 secondes
   })
   
   // ✅ Préparation avant transaction
   const data = await prepareData()
   await prisma.$transaction(async (tx) => {
     await tx.create({ data }) // Rapide
   })
   ```

---

## 💾 Problèmes de cache

### Cache Redis déconnecté

**Diagnostic** :
```bash
# Test connexion Redis
redis-cli ping # PONG si OK

# Stats Redis
redis-cli info stats
```

**Solutions** :
1. **Fallback graceful** :
   ```typescript
   export async function getFromCache<T>(key: string): Promise<T | null> {
     try {
       if (!redis.isConnected) return null
       return await redis.get(key)
     } catch (error) {
       logger.warn('Cache unavailable, fallback to DB', { error })
       return null
     }
   }
   ```

2. **Reconnexion automatique** :
   ```typescript
   const redis = new Redis({
     host: process.env.REDIS_HOST,
     retryDelayOnFailover: 100,
     maxRetriesPerRequest: 3,
     lazyConnect: true
   })
   ```

### Cache stale (données obsolètes)

**Diagnostic** :
```bash
# Vérifier TTL clés
redis-cli TTL "matches:upcoming"

# Contenu cache vs DB
redis-cli GET "user:123" | jq
psql -c "SELECT * FROM users WHERE id = '123';" --json
```

**Solutions** :
1. **Invalidation proactive** :
   ```typescript
   export async function updateMatch(id: string, data: UpdateMatchData) {
     const updated = await prisma.match.update({ where: { id }, data })
     
     // Invalider caches liés
     await cache.del([
       `match:${id}`,
       'matches:upcoming',
       `matches:user:${userId}` // Si affecte utilisateur
     ])
     
     return updated
   }
   ```

2. **Cache warming** :
   ```typescript
   // Pré-chauffer caches critiques
   export async function warmCache() {
     const upcomingMatches = await getUpcomingMatches()
     await cache.set('matches:upcoming', upcomingMatches, 300) // 5min
   }
   ```

---

## 📊 Monitoring et logs

### Logs structurés analysis

**Rechercher erreurs spécifiques** :
```bash
# Erreurs auth dernière heure
jq 'select(.level=="error" and .service=="auth" and .timestamp > "2024-01-15T11:00:00Z")' app.log

# Performance dégradée
jq 'select(.duration > 500)' app.log | head -10

# Utilisateur spécifique  
jq 'select(.userId=="user123")' app.log | tail -20
```

**Alertes métriques** :
```bash
# API response time spike
curl -s http://localhost:3000/api/metrics | grep 'http_request_duration_ms' | awk '{if($2>200) print "ALERT: Slow API " $0}'

# Error rate high
curl -s http://localhost:3000/api/metrics | grep 'http_requests_errors_total' | awk '{if($2>10) print "ALERT: High errors " $0}'
```

### Debug mode activation

**Développement** :
```bash
# Logs détaillés
DEBUG=futsal:* npm run dev

# Prisma query logs
DATABASE_URL="...?schema=public&sslmode=prefer" LOG_LEVEL=debug npm run dev
```

**Production (temporaire)** :
```typescript
// Runtime log level change
import { logger } from '@/lib/logging'

// Augmenter verbosité temporairement
logger.level = 'debug' // Attention: impact performance
setTimeout(() => logger.level = 'info', 300000) // 5 minutes
```

---

## 🚨 Escalade et support

### Matrice d'escalade

| Gravité | Temps réponse | Action immédiate |
|---------|---------------|------------------|
| **Critique** | 15 minutes | Notification équipe + rollback |
| **Élevée** | 1 heure | Investigation approfondie |
| **Moyenne** | 4 heures | Planification correction |
| **Faible** | 24 heures | Ajout backlog |

### Collecte d'informations incident

**Template rapport d'incident** :
```markdown
## 🚨 Incident Report

**Timestamp**: 2024-01-15T12:30:45Z
**Severity**: Critical/High/Medium/Low
**Status**: Ongoing/Resolved
**Reporter**: admin@futsal.app

### Symptoms
- Users cannot login (401 errors)
- API response times >5s
- Match inscriptions failing

### Impact
- Affected users: ~50 (estimated)
- Business impact: Match bookings blocked
- Duration: 15 minutes and ongoing

### Immediate actions taken
1. Restarted auth service
2. Checked database connections
3. Verified Redis availability

### Root cause (if known)
Database connection pool exhausted after traffic spike

### Next steps
- [ ] Increase connection pool size
- [ ] Monitor for 30 minutes
- [ ] Update runbook with prevention steps
```

### Contacts d'urgence

**Équipe technique** :
- Primary: `admin@futsal.app`
- Secondary: `dev@futsal.app`
- Phone: `+33-X-XX-XX-XX-XX` (24/7)

**Prestataires** :
- **Database**: `postgresql-support@provider.com`
- **Hosting**: `infra@provider.com`
- **Monitoring**: `alerts@monitoring-service.com`

---

## 🎯 Checklist debug rapide

### Problème utilisateur (2 minutes)

```bash
# 1. Vérifier utilisateur existe
psql -c "SELECT id, email, role, \"createdAt\" FROM users WHERE email = 'user@example.com';"

# 2. Sessions actives
psql -c "SELECT * FROM sessions WHERE \"userId\" = 'USER_ID' AND \"expiresAt\" > NOW();"

# 3. Activité récente
jq 'select(.userId=="USER_ID")' app.log | tail -5
```

### Problème match (2 minutes)

```bash
# 1. Match existe et status
psql -c "SELECT id, date, \"maxPlayers\", status FROM matches WHERE id = 'MATCH_ID';"

# 2. Inscriptions actuelles
psql -c "SELECT COUNT(*) as inscriptions FROM match_players WHERE \"matchId\" = 'MATCH_ID' AND status = 'registered';"

# 3. Logs inscription récents  
jq 'select(.matchId=="MATCH_ID" and .operation=="match_join")' app.log | tail -3
```

### Problème système (3 minutes)

```bash
# 1. Health check
curl -f http://localhost:3000/api/health || echo "Health check failed"

# 2. Services actifs
docker ps --format "table {{.Names}}\t{{.Status}}" || pm2 status

# 3. Ressources système
free -h && df -h | grep -E "(/$|/var)"

# 4. Erreurs récentes
tail -20 /var/log/futsal/app.log | jq 'select(.level=="error")'
```

---

**🔧 Le dépannage efficace nécessite une approche méthodique. Utilisez ce guide comme checklist et n'hésitez pas à escalader si nécessaire !**

*Guide mis à jour le 2024-02-15 | Version 1.0.0*