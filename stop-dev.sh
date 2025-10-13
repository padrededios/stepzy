#!/bin/bash

echo "🛑 Stopping Stepzy development environment..."

# Kill processes on port 3000 (web-app)
echo "  Stopping web-app (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill processes on port 3001 (backend)
echo "  Stopping backend (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Kill any remaining node processes that might be related
echo "  Cleaning up remaining processes..."
pkill -f "turbo" 2>/dev/null || true
pkill -f "tsx.*backend" 2>/dev/null || true
pkill -f "next.*web-app" 2>/dev/null || true

# Stop Docker services
echo "  Stopping Docker services..."
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

echo "✅ All development processes stopped!"
