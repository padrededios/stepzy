#!/bin/bash

echo "🚀 Starting Stepzy in development mode..."

# Stop any existing Docker services
echo "🛑 Stopping existing Docker services..."
docker compose -f docker-compose.dev.yml down

# Start Docker services
echo "📦 Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "📊 Running database migrations..."
npm run db:migrate

# Seed database (optional - comment out if not needed)
echo "🌱 Seeding database..."
npm run db:seed

# Start Next.js application
echo "🎯 Starting Next.js application..."
npm run dev