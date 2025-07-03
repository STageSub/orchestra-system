#!/bin/bash

# Script för att köra migrationer på en ny Supabase-databas
# Användning: ./scripts/run-migrations.sh "postgresql://..."

if [ -z "$1" ]; then
    echo "❌ Error: Database URL krävs"
    echo "Användning: ./scripts/run-migrations.sh \"postgresql://...\""
    exit 1
fi

DATABASE_URL="$1"

echo "🚀 Kör migrationer på ny databas..."
echo "📊 Database URL: ${DATABASE_URL:0:30}..."

# Kör Prisma migrationer
echo "⏳ Kör Prisma migrate deploy..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrationer slutförda!"
    echo ""
    echo "📝 Nästa steg:"
    echo "1. Gå tillbaka till superadmin-panelen"
    echo "2. Orkestern ska nu visa status 'Aktiv'"
    echo "3. Admin kan logga in med de uppgifter som visades tidigare"
else
    echo "❌ Migrationer misslyckades!"
    echo "Kontrollera databas-URL och försök igen."
    exit 1
fi