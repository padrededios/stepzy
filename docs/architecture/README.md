# 🏗️ Architecture Decision Records (ADRs)

Cette section documente les décisions architecturales importantes prises pour le projet Futsal Reservation SaaS.

## Index des ADRs

| ADR | Titre | Statut | Date |
|-----|-------|--------|------|
| [ADR-001](ADR-001-next-js-app-router.md) | Adoption Next.js App Router | ✅ Accepté | 2024-01-15 |
| [ADR-002](ADR-002-better-auth.md) | Choix Better-auth pour l'authentification | ✅ Accepté | 2024-01-18 |
| [ADR-003](ADR-003-prisma-postgresql.md) | Prisma ORM avec PostgreSQL | ✅ Accepté | 2024-01-20 |
| [ADR-004](ADR-004-tdd-methodology.md) | Méthodologie TDD stricte | ✅ Accepté | 2024-01-22 |
| [ADR-005](ADR-005-tailwind-css-v4.md) | Tailwind CSS v4 pour le styling | ✅ Accepté | 2024-01-25 |
| [ADR-006](ADR-006-redis-caching.md) | Redis pour le cache et sessions | ✅ Accepté | 2024-02-01 |
| [ADR-007](ADR-007-structured-logging.md) | Logging structuré JSON | ✅ Accepté | 2024-02-05 |
| [ADR-008](ADR-008-docker-production.md) | Docker multi-stage pour production | ✅ Accepté | 2024-02-10 |

## Structure d'un ADR

Chaque ADR suit ce template :

```markdown
# ADR-XXX: Titre de la décision

## Statut
[Proposé | Accepté | Déprécié | Remplacé par ADR-YYY]

## Contexte
Description du problème et du contexte qui nécessite une décision.

## Décision
La décision architecturale prise.

## Conséquences
### Positives
- Liste des avantages

### Négatives  
- Liste des inconvénients

### Neutres
- Autres conséquences

## Alternatives considérées
Liste des autres options évaluées et pourquoi elles ont été rejetées.

## Références
- Liens vers documentation
- Articles pertinents
- Issues GitHub
```

## Principes directeurs

### 1. Simplicité
- Privilégier les solutions simples et éprouvées
- Éviter la sur-ingénierie
- Maintenir la lisibilité du code

### 2. Performance
- Optimiser pour les temps de réponse <200ms
- Utiliser le cache intelligemment
- Minimiser les requêtes base de données

### 3. Sécurité
- Security by design
- Validation stricte des inputs
- Sessions sécurisées
- Protection OWASP Top 10

### 4. Maintenabilité
- Code auto-documenté
- Tests exhaustifs (95%+ couverture)
- Architecture modulaire
- Conventions strictes

### 5. Scalabilité
- Architecture stateless
- Cache distribué
- Base de données optimisée
- Monitoring complet

## Vue d'ensemble architecture

```
┌─────────────────────────────────────────────┐
│                Frontend                      │
│  Next.js 15 (App Router) + TypeScript      │
│  Tailwind CSS v4 + React 18                │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│              API Layer                      │
│  Next.js API Routes + Better-auth          │
│  Rate Limiting + Validation                 │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│            Business Logic                   │
│  Services + Repositories Pattern           │
│  Domain Models + Use Cases                  │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│              Data Layer                     │
│  Prisma ORM + PostgreSQL                   │
│  Redis Cache + Session Store               │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│           Infrastructure                    │
│  Docker + Monitoring + Logging             │
│  Health Checks + Metrics                   │
└─────────────────────────────────────────────┘
```

## Patterns architecturaux utilisés

### 1. Repository Pattern
```typescript
interface MatchRepository {
  findById(id: string): Promise<Match | null>
  findUpcoming(): Promise<Match[]>
  create(data: CreateMatchData): Promise<Match>
  update(id: string, data: UpdateMatchData): Promise<Match>
}
```

### 2. Service Layer
```typescript
class MatchService {
  constructor(
    private matchRepo: MatchRepository,
    private userRepo: UserRepository,
    private notificationService: NotificationService
  ) {}

  async joinMatch(matchId: string, userId: string): Promise<JoinResult> {
    // Business logic here
  }
}
```

### 3. Middleware Pattern
```typescript
export const withAuth = (handler: RouteHandler) => {
  return requireAuth(async (req, context) => {
    return handler(req, context)
  })
}
```

### 4. Observer Pattern (Notifications)
```typescript
class NotificationService {
  private observers: Observer[] = []

  notify(event: DomainEvent) {
    this.observers.forEach(observer => observer.handle(event))
  }
}
```

## Contraintes techniques

### Performance
- API Response time: <200ms P95
- Database queries: <100ms P95  
- Cache hit ratio: >80%
- Page load time: <3s P95

### Sécurité
- HTTPS obligatoire en production
- CSP headers configurés
- Rate limiting: 5 req/min login
- Session timeout: 7 jours

### Qualité
- Test coverage: >95%
- TypeScript strict mode
- ESLint + Prettier
- Zero console.log en production

### Monitoring
- Health checks sur tous services
- Métriques Prometheus
- Logs structurés JSON
- Alerting sur erreurs critiques

## Migration paths

### Base de données
```sql
-- Toutes migrations via Prisma
-- Rollback strategy définie
-- Zero-downtime deployments
```

### Cache
```typescript
// Graceful degradation si Redis indisponible
// Fallback mémoire en développement
// TTL adaptatifs selon usage
```

### API Versioning
```typescript
// Backward compatibility maintenue
// Deprecation warnings avant breaking changes
// Versioning dans headers si nécessaire
```

## Documentation

- **API Spec**: OpenAPI 3.0 complète
- **Code**: JSDoc pour fonctions publiques
- **Architecture**: Diagrammes C4 model
- **Deployment**: Runbooks opérationnels

## Révision des ADRs

Les ADRs sont revues :
- À chaque évolution majeure
- Trimestriellement pour cohérence
- Lors de problèmes performance/sécurité
- Avant changements architecturaux

## Création nouveau ADR

1. Copier le template
2. Numéroter séquentiellement
3. Remplir toutes les sections
4. Review par l'équipe technique
5. Validation avant implémentation
6. Mise à jour index

---

**Note**: Ces décisions reflètent l'état à un moment donné. Elles peuvent évoluer selon les besoins du projet et les retours d'expérience.