# 🚀 Guide de Déploiement - Stepzy

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- Docker et Docker Compose
- PostgreSQL 14+ (ou conteneur Docker)
- Redis 6+ (ou conteneur Docker)
- Domaine configuré avec SSL/TLS

## 🐳 Déploiement Docker (Recommandé)

### 1. Configuration de l'environnement

Créez un fichier `.env.production` :

```bash
# Database
DATABASE_URL="postgresql://stepzy:password@db:5432/stepzy_prod"

# Authentication
BETTER_AUTH_SECRET="your-super-secure-secret-key-here"
BETTER_AUTH_URL="https://your-domain.com"

# Redis Cache
REDIS_URL="redis://redis:6379"

# App Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_NAME="Stepzy"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"

# Monitoring (optionnel)
SENTRY_DSN="your-sentry-dsn"
ANALYTICS_ID="your-analytics-id"

# Nettoyage automatique
CLEANUP_SECRET="your-cleanup-secret"
```

### 2. Configuration Docker

Créez `docker-compose.prod.yml` :

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: stepzy_prod
      POSTGRES_USER: stepzy
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stepzy -d stepzy_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Reverse Proxy (Nginx)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. Dockerfile de production

Créez `Dockerfile.prod` :

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### 4. Configuration Nginx

Créez `nginx.conf` :

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

        # Rate limiting for auth endpoints
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Rate limiting for API endpoints
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### 5. Déploiement

```bash
# 1. Cloner le repository
git clone <your-repo-url>
cd stepzy

# 2. Configurer les variables d'environnement
cp .env.example .env.production
# Éditer .env.production avec vos valeurs

# 3. Lancer les services
docker-compose -f docker-compose.prod.yml up -d

# 4. Exécuter les migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 5. Seed initial (optionnel)
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed
```

## 🔧 Maintenance

### Mise à jour de l'application

```bash
# 1. Sauvegarder la base de données
docker-compose -f docker-compose.prod.yml exec db pg_dump -U stepzy stepzy_prod > backup-$(date +%Y%m%d).sql

# 2. Arrêter les services
docker-compose -f docker-compose.prod.yml down

# 3. Mettre à jour le code
git pull origin main

# 4. Rebuilder et redémarrer
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Exécuter les migrations si nécessaire
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### Nettoyage automatique

Configurez un cron job pour le nettoyage :

```bash
# Ajouter au crontab (crontab -e)
# Nettoyage quotidien à 2h du matin
0 2 * * * curl -X POST https://your-domain.com/api/cleanup -H "Authorization: Bearer your-cleanup-secret"
```

### Monitoring des logs

```bash
# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f app

# Logs spécifiques
docker-compose -f docker-compose.prod.yml logs -f db
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Sauvegarde automatique

Script de sauvegarde `backup.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U stepzy stepzy_prod | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Sauvegarder Redis (optionnel, pour les sessions)
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb - > $BACKUP_DIR/redis_backup_$DATE.rdb

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Ajouter au crontab :
```bash
# Sauvegarde quotidienne à 3h du matin
0 3 * * * /path/to/backup.sh >> /var/log/stepzy-backup.log 2>&1
```

## 📊 Monitoring

### Health Checks

L'application expose plusieurs endpoints de monitoring :

- `/api/health` - État général
- `/api/health/db` - État base de données
- `/api/health/redis` - État cache Redis

### Métriques Prometheus

Configurez Prometheus pour scraper `/api/metrics` :

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'stepzy'
    static_configs:
      - targets: ['your-domain.com:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

## 🔒 Sécurité

### SSL/TLS

Utilisez Let's Encrypt pour les certificats gratuits :

```bash
# Installation Certbot
apt-get install certbot

# Génération certificat
certbot certonly --standalone -d your-domain.com

# Renouvellement automatique
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Firewall

Configurez UFW ou iptables :

```bash
# UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Variables sensibles

- Générez des secrets forts pour `BETTER_AUTH_SECRET`
- Changez les mots de passe par défaut
- Limitez l'accès réseau aux services (PostgreSQL, Redis)
- Utilisez des certificats SSL valides

## ⚡ Performance

### Optimisations

1. **Cache Redis** : Configuré pour les sessions et données fréquentes
2. **Gzip compression** : Activée dans Nginx
3. **Rate limiting** : Protège contre les abus
4. **Health checks** : Redémarrage automatique des services défaillants

### Scaling

Pour une montée en charge :

```yaml
# docker-compose.prod.yml - Scaling horizontal
services:
  app:
    deploy:
      replicas: 3
    # Configuration load balancer
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f`
2. Testez les health checks : `curl https://your-domain.com/api/health`
3. Vérifiez les services : `docker-compose ps`
4. Consultez la documentation de troubleshooting

---

*Ce guide couvre un déploiement production standard. Adaptez selon vos besoins spécifiques d'infrastructure.*