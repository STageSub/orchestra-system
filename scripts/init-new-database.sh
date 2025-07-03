#!/bin/bash

# Script för att initiera en ny Supabase-databas
# Användning: ./scripts/init-new-database.sh "postgresql://..."

if [ -z "$1" ]; then
    echo "❌ Error: Database URL krävs"
    echo "Användning: ./scripts/init-new-database.sh \"postgresql://...\""
    exit 1
fi

DATABASE_URL="$1"

echo "🚀 Initierar ny databas..."
echo "📊 Database URL: ${DATABASE_URL:0:50}..."

# Kör SQL-script för att skapa tabeller
echo "⏳ Skapar tabeller..."
psql "$DATABASE_URL" < scripts/init-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Tabeller skapade!"
    
    # Nu kör vi Prisma-migrationer
    echo "⏳ Kör Prisma-migrationer..."
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
        echo "Tabellerna är skapade men migreringarna kunde inte köras."
    fi
else
    echo "❌ Kunde inte skapa tabeller!"
    echo "Kontrollera databas-URL och försök igen."
    exit 1
fi