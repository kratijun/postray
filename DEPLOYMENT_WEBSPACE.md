# PostRay - Deployment auf Webspace

## Wichtige Voraussetzungen

**PostRay ist eine Next.js App mit Node.js Backend** - du brauchst:

✅ **Node.js 18+** auf deinem Webspace
✅ **npm** oder einen Package Manager
✅ **Schreibrechte** für SQLite-Datenbank
✅ **Port 3000** oder einen anderen Port der verfügbar ist
✅ **HTTPS** (für Production mit echten Daten)

⚠️ **KEIN** reiner statischer Webspace (nur HTML/CSS/PHP) - das funktioniert NICHT!

## Wann funktioniert es?

✅ **Shared Hosting mit Node.js Support**
- z.B. Uberspace, Contabo, HostEurope Node.js, Strato Cloud Server
- DigitalOcean, Hetzner, AWS Lightsail
- VPS mit SSH-Zugriff

❌ **Standard Shared Hosting OHNE Node.js**
- Reine PHP/HTML Hosting
- Statische Webspace ohne Backend-Support

## Option 1: Deployment mit SSH-Zugriff (Empfohlen)

Wenn du SSH-Zugriff auf deinen Server hast:

### 1. Projekt auf Server hochladen

```bash
# Auf deinem lokalen Rechner
scp -r . username@dein-server.de:/pfad/zum/webspace/postray
```

### 2. Auf dem Server einloggen und konfigurieren

```bash
ssh username@dein-server.de

# Ins Projektverzeichnis wechseln
cd /pfad/zum/webspace/postray

# Node.js-Version prüfen
node --version  # Sollte 18+ sein

# Dependencies installieren
npm install

# Umgebungsvariablen einrichten
nano .env
```

### 3. .env Datei erstellen/anpassen

```env
NEXTAUTH_URL=https://deine-domain.com
NEXTAUTH_SECRET=generiere-ein-sicheres-secret-hier
DATABASE_URL="file:./prisma/postray.db"
```

**Secret generieren:**
```bash
openssl rand -base64 32
```

### 4. Build erstellen

```bash
npm run build
```

### 5. Server starten (mit PM2 für Production)

```bash
# PM2 installieren (falls nicht vorhanden)
npm install -g pm2

# App starten
pm2 start npm --name "postray" -- start

# Auto-Start beim Server-Neustart einrichten
pm2 startup
pm2 save
```

### 6. Port-Konfiguration

Die App läuft standardmäßig auf Port 3000. Du musst entweder:
- Port 3000 vom Webspace bereitstellen, oder
- Port ändern mit `PORT=8000 npm start` (z.B. Port 8000)

## Option 2: Deployment auf VPS (z.B. DigitalOcean, Hetzner)

Wenn du einen VPS hast, kannst du auch Docker verwenden:

```bash
# Projekt hochladen
scp -r . root@dein-server.de:/var/www/postray

# Auf Server einloggen
ssh root@dein-server.de

# Ins Verzeichnis wechseln
cd /var/www/postray

# Docker Compose starten
docker-compose up -d

# Logs ansehen
docker-compose logs -f
```

## Option 3: Alternative Hosting-Lösungen (Einfacher!)

### Vercel (Kostenlos für kleine Projekte)

```bash
# Lokal installieren
npm i -g vercel

# Projekt deployen
cd /pfad/zum/projekt
vercel

# Folge den Anweisungen im Terminal
```

✅ Automatische HTTPS, CDN, keine Server-Verwaltung

### Railway.app

1. Gehe auf [railway.app](https://railway.app)
2. Verbinde dein GitHub Repository
3. Railway erkennt Next.js automatisch
4. Setze Umgebungsvariablen im Dashboard
5. Fertig! ✨

✅ Kostenloser Plan verfügbar, automatisches Deployment

### Render.com

Ähnlich wie Railway:
1. GitHub Repository verbinden
2. Next.js automatisch erkannt
3. Environment Variables setzen
4. Automatisches HTTPS

## Option 4: Statischer Export (NUR Frontend, funktioniert eingeschränkt!)

⚠️ **ACHTUNG:** Dies funktioniert NICHT vollständig, da PostRay ein Backend (Auth, API, Datenbank) braucht!

Wenn du trotzdem nur das Frontend deployen willst:

```bash
# next.config.js anpassen:
# output: 'export'

# Build
npm run build

# Statische Dateien sind in /out
```

❌ Login, Registrierung, Rayons funktionieren NICHT
❌ Nur die UI wird angezeigt

## Was du brauchst für vollständiges Deployment:

1. **Node.js 18+** auf dem Server
2. **Umgebungsvariablen** (`.env` Datei)
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - DATABASE_URL
3. **Port-Zugriff** (z.B. 3000 oder 8000)
4. **HTTPS** (Let's Encrypt ist kostenlos)
5. **Prozess-Manager** (PM2 empfohlen)

## Schnelltest: Welcher Hosting-Typ bist du?

**Frage 1:** Hast du SSH-Zugriff?
- ✅ Ja → Weiter zu Option 1
- ❌ Nein → Weiter zu Frage 2

**Frage 2:** Kannst du Node.js installieren/verwenden?
- ✅ Ja → Weiter zu Option 2
- ❌ Nein → Weiter zu Option 3

**Frage 3:** Willst du einfaches Deployment ohne Server-Verwaltung?
- ✅ Ja → Vercel, Railway oder Render verwenden
- ❌ Nein → Eigenen Server einrichten

## Alternative: Lokal laufen lassen + Port-Forwarding

Wenn dein Webspace keine Node.js-Unterstützung hat:

```bash
# Auf deinem PC
npm run dev

# Mit ngrok (kostenlos)
ngrok http 3000
# Gibt dir eine öffentliche URL: https://abc123.ngrok.io
```

⚠️ **Nur für Testing!** Nicht für Production geeignet.

## Brauchst du Hilfe?

Falls du nicht sicher bist, welcher Hosting-Typ du hast, schreibe mir:
- Welche Firma/Provider?
- Welcher Plan (Shared, VPS, Cloud)?
- Hast du SSH-Zugriff?

Dann kann ich dir eine konkrete Anleitung für deinen Fall geben! 🚀

