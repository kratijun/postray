#!/bin/bash

# PostRay Vercel Deployment Script
# Führe diese Befehle nacheinander aus

echo "🚀 PostRay Vercel Deployment"
echo "=============================="
echo ""

# 1. Git Repository auf GitHub hochladen
echo "📦 Schritt 1: GitHub Repository erstellen..."
echo "1. Gehe zu github.com und erstelle ein neues Repository namens 'postray'"
echo "2. Dann führe diese Befehle aus:"
echo ""
echo "   git remote add origin https://github.com/DEIN-USERNAME/postray.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

# 2. Vercel CLI installieren
echo "📦 Schritt 2: Vercel CLI installieren..."
read -p "Soll ich die Vercel CLI jetzt installieren? (j/n) " install_cli
if [ "$install_cli" = "j" ]; then
    npm install -g vercel
    echo "✅ Vercel CLI installiert!"
else
    echo "⚠️  Installiere Vercel CLI manuell mit: npm install -g vercel"
fi
echo ""

# 3. Deploy to Vercel
echo "🚀 Schritt 3: Projekt auf Vercel deployen..."
read -p "Bereit für Deployment? (j/n) " ready
if [ "$ready" = "j" ]; then
    vercel
    echo ""
    echo "✅ Deployment gestartet!"
    echo ""
    echo "📝 WICHTIG - Was du jetzt tun musst:"
    echo "1. Setze in Vercel Dashboard die Environment Variables:"
    echo "   - NEXTAUTH_URL=https://dein-projekt.vercel.app"
    echo "   - NEXTAUTH_SECRET=<generiere mit: openssl rand -base64 32>"
    echo "   - DATABASE_URL=<von Vercel Postgres Storage kopieren>"
    echo ""
    echo "2. Erstelle PostgreSQL Datenbank in Vercel Storage"
    echo "3. Kopiere DATABASE_URL von der PostgreSQL Datenbank"
    echo ""
    echo "4. Aktualisiere prisma/schema.prisma:"
    echo "   provider = \"postgresql\"  # statt \"sqlite\""
    echo ""
    echo "5. Pushe die Änderung:"
    echo "   git add prisma/schema.prisma"
    echo "   git commit -m \"Switch to PostgreSQL\""
    echo "   git push"
fi

echo ""
echo "🎉 Fertig! Dein Projekt sollte jetzt laufen!"
echo ""
echo "📖 Weitere Infos in DEPLOYMENT_WEBSPACE.md"

