#!/bin/bash
set -e

echo "Installing dependencies..."
npm install -g pnpm@9
pnpm install

echo "Running database migrations..."
pnpm db:migrate

echo "Seeding database..."
# Seed is applied via supabase db reset or manually
echo "Run 'pnpm db:reset' to seed the database"

echo "Dev environment ready!"
