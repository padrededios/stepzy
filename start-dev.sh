#!/bin/bash

# Parse command line arguments
RESET_DB=false
INIT_DB=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --reset)
      RESET_DB=true
      shift
      ;;
    --init)
      INIT_DB=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1"
      echo "Usage: $0 [--reset] [--init]"
      echo "  --reset  Reset the database (migrate reset)"
      echo "  --init   Initialize database with test data (seed)"
      exit 1
      ;;
  esac
done

# Trap SIGINT and SIGTERM to cleanup properly
cleanup() {
  echo ""
  echo "🛑 Stopping development servers..."

  # Kill all child processes
  if [ ! -z "$DEV_PID" ]; then
    pkill -P $DEV_PID 2>/dev/null || true
    kill $DEV_PID 2>/dev/null || true
  fi

  # Kill any remaining processes on ports 3000 and 3001
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true

  echo "✅ Cleanup complete!"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting Stepzy in development mode..."

# Stop any existing Docker services
echo "🛑 Stopping existing Docker services..."
docker compose -f docker-compose.dev.yml down

# Start Docker services (PostgreSQL, Redis)
echo "📦 Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec stepzy-postgres pg_isready -U stepzy_user > /dev/null 2>&1; do
  echo "  Waiting for PostgreSQL..."
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Navigate to backend directory for database operations
cd packages/backend

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Handle database reset if requested
if [ "$RESET_DB" = true ]; then
  echo "⚠️  Resetting database..."
  PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma migrate reset --force
  echo "✅ Database reset complete!"
else
  # Run database migrations (only apply new migrations)
  echo "📊 Running database migrations..."
  npx prisma migrate deploy
fi

# Seed database with test data if requested or if reset was done
if [ "$INIT_DB" = true ] || [ "$RESET_DB" = true ]; then
  echo "🌱 Seeding database with test data..."
  npm run db:seed
  echo "✅ Database seeded!"
fi

# Return to root directory
cd ../..

# Build shared package (if needed)
echo "📦 Building shared package..."
npm run build --workspace=@stepzy/shared

# Sync assets to frontends
echo "🖼️  Synchronizing assets..."
npm run sync-assets

# Start backend and web-app in parallel with Turbo
echo "🎯 Starting backend and web-app..."
echo ""
echo "📍 Backend API:  http://localhost:3001"
echo "📍 Frontend:     http://localhost:3000"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo ""

# Run npm dev in background and capture PID
npm run dev &
DEV_PID=$!

# Wait for the process
wait $DEV_PID