# PostRay - Deployment-Anleitung

## Voraussetzungen

- Node.js 18.x oder höher
- npm oder yarn
- SQLite (für lokale Entwicklung) oder PostgreSQL (für Production)

## Lokale Entwicklung

1. **Abhängigkeiten installieren:**
```bash
npm install
```

2. **Umgebungsvariablen einrichten:**
```bash
cp .env.example .env
```

Bearbeiten Sie `.env` und setzen Sie:
- `NEXTAUTH_SECRET`: Generieren Sie einen sicheren Secret (z.B. `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Ihre App-URL (z.B. `http://localhost:3000`)

3. **Datenbank initialisieren:**
```bash
npx prisma migrate dev --name init
```

4. **Entwicklungsserver starten:**
```bash
npm run dev
```

## Production Build

1. **Umgebungsvariablen setzen:**
```bash
export NEXTAUTH_URL=https://ihre-domain.com
export NEXTAUTH_SECRET=ihr-sicherer-secret
export DATABASE_URL="file:./prisma/postray.db"
```

2. **Production Build erstellen:**
```bash
npm run build
```

3. **Production Server starten:**
```bash
npm start
```

## Docker Deployment

1. **Docker Image bauen:**
```bash
docker build -t postray .
```

2. **Mit docker-compose:**
```bash
docker-compose up -d
```

## Vercel Deployment

1. **Vercel CLI installieren:**
```bash
npm i -g vercel
```

2. **Projekt deployen:**
```bash
vercel
```

3. **Umgebungsvariablen in Vercel Dashboard setzen:**
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` (für PostgreSQL)

## Wichtige Hinweise

- **NEXTAUTH_SECRET**: Muss in Production sicher sein und sollte nie im Code stehen
- **Datenbank**: Für Production wird PostgreSQL empfohlen statt SQLite
- **HTTPS**: Für Production immer HTTPS verwenden
- **CORS**: Falls nötig, in `next.config.js` konfigurieren

