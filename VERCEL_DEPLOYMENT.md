# 🚀 PostRay auf Vercel deployen - Komplette Anleitung

## ✅ Voraussetzungen
- GitHub Account
- Vercel Account (kostenlos anmelden auf vercel.com)

---

## 📝 Schritt 1: GitHub Repository erstellen

### 1.1 Neues Repository
1. Gehe zu **[github.com](https://github.com)**
2. Klicke oben rechts auf **"+"** → **"New repository"**
3. Repository Name: `postray`
4. Wähle **Public** oder **Private**
5. ⚠️ **NICHT** "Add README", "Add .gitignore" oder "Choose a license" anklicken!
6. Klicke **"Create repository"**

### 1.2 Projekt hochladen
```bash
# Im Terminal im postray Verzeichnis:
git remote add origin https://github.com/DEIN-USERNAME/postray.git
git branch -M main
git push -u origin main
```

**⚠️ Ersetze `DEIN-USERNAME` mit deinem echten GitHub-Username!**

---

## 🗄️ Schritt 2: PostgreSQL Datenbank erstellen

Vercel braucht PostgreSQL statt SQLite (für Production).

### 2.1 Vercel Storage erstellen
1. Gehe zu **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. Klicke oben auf **"Storage"** → **"Create"**
3. Wähle **"Postgres"**
4. Klicke **"Continue"**
5. **Name:** `postray-db`
6. **Region:** Wähle die nächste zu dir (z.B. Frankfurt)
7. **Plan:** Hobby (kostenlos)
8. Klicke **"Create"**
9. ⏰ Warte 30-60 Sekunden bis die DB fertig ist

### 2.2 Connection String kopieren
1. In der erstellten Postgres DB
2. Tab **"Settings"**
3. Im Abschnitt **"Connection string"**
4. Klicke auf **"Copy"** neben `.env.local`
5. Speichere diesen String - du brauchst ihn gleich!

---

## 🚀 Schritt 3: Projekt auf Vercel deployen

### 3.1 Projekt erstellen
1. In Vercel Dashboard klicke **"Add New..."** → **"Project"**
2. Wähle dein `postray` Repository aus
3. Klicke **"Import"**

### 3.2 Konfiguration
Lasse die Standard-Einstellungen:
- **Framework Preset:** Next.js (automatisch erkannt)
- **Root Directory:** `./`
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅
- **Install Command:** `npm install` ✅

### 3.3 Environment Variables
**WICHTIG:** Bevor du "Deploy" klickst, setze die Umgebungsvariablen!

1. Scrolle nach unten zu **"Environment Variables"**
2. Klicke **"Add"** und füge hinzu:

| Variable Name | Value | Beschreibung |
|---------------|-------|--------------|
| `NEXTAUTH_URL` | `https://postray-xxxxx.vercel.app` | Ersetze `xxxxx` mit deiner Projekt-ID |
| `NEXTAUTH_SECRET` | `<generierter Secret>` | (siehe unten wie generieren) |
| `DATABASE_URL` | `<von Postgres kopiert>` | Connection String aus Schritt 2 |

**NEXTAUTH_SECRET generieren:**
```bash
# Im Terminal:
openssl rand -base64 32
```
Kopiere den generierten String in `NEXTAUTH_SECRET`.

**⚠️ ACHTUNG:** `NEXTAUTH_URL` kannst du erst nach dem ersten Deployment korrigieren!

3. Klicke **"Deploy"**
4. ⏰ Warte 2-3 Minuten für den Build

---

## 🔧 Schritt 4: PostgreSQL Schema einrichten

Das Projekt ist aktuell für SQLite konfiguriert. Wir müssen auf PostgreSQL umstellen.

### 4.1 Schema anpassen
```bash
# Im Terminal:
nano prisma/schema.prisma
```

Ändere diese Zeile:
```prisma
# VORHER:
provider = "sqlite"

# NACHHER:
provider = "postgresql"
```

Speichere mit `Ctrl+X`, dann `Y`, dann `Enter`.

### 4.2 Änderungen hochladen
```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for Vercel"
git push
```

**Vercel deployt automatisch neu!** ⏰ Warte 2-3 Minuten.

---

## 🔐 Schritt 5: NEXTAUTH_URL korrigieren

Nach dem ersten erfolgreichen Deployment:

1. Gehe zu Vercel Dashboard
2. Klicke auf dein Projekt
3. Gehe zu **Settings** → **Environment Variables**
4. Finde `NEXTAUTH_URL`
5. Klicke auf **Edit**
6. Setze die **echte URL** deines Projekts:
   - `https://postray-xxxxx.vercel.app` (oder deine Custom Domain)
7. Klicke **Save**

**WICHTIG:** Redeploy notwendig! Gehe zu **Deployments** → neuestes Deployment → **•••** → **Redeploy**

---

## 🎯 Schritt 6: Testen

1. Gehe zu deiner Vercel-URL: `https://postray-xxxxx.vercel.app`
2. Du solltest die Login-Seite sehen
3. Klicke auf **"Registrieren"**
4. Erstelle einen Test-Account
5. Erstelle einen Rayon
6. Teste die Karte

✅ **Alles funktioniert? Super!** 🎉

---

## 🔧 Troubleshooting

### Problem: "Authentication failed"
**Lösung:**
- Prüfe ob `NEXTAUTH_SECRET` gesetzt ist
- Prüfe ob `NEXTAUTH_URL` korrekt ist (https://...)
- Redeploy das Projekt

### Problem: "Database connection failed"
**Lösung:**
- Prüfe ob `DATABASE_URL` korrekt in Environment Variables ist
- Prüfe ob PostgreSQL Storage in Vercel aktiv ist
- Prüfe ob `prisma/schema.prisma` `provider = "postgresql"` hat

### Problem: "Page not found" oder Build-Fehler
**Lösung:**
- Prüfe Vercel Logs: Dashboard → Deployments → neuestes Deployment → Logs
- Meistens fehlt eine Environment Variable

### Problem: Map funktioniert nicht
**Lösung:**
- Ist normal bei SSR - die Map lädt beim ersten Mal manchmal nicht
- Lade die Seite neu (F5)
- Karten-Tiles von OpenStreetMap sollten trotzdem geladen werden

---

## 📦 Weitere Schritte (Optional)

### Custom Domain hinzufügen
1. Vercel Dashboard → Projekt → **Settings** → **Domains**
2. Klicke **"Add"**
3. Gib deine Domain ein (z.B. `postray.deineregelndomain.com`)
4. Folge den DNS-Anweisungen

### Monitoring einrichten
Vercel trackt automatisch:
- Traffic
- Response Times
- Fehler
- Deployment History

Schaue in **Analytics** im Dashboard.

---

## 🎉 Fertig!

Dein PostRay ist jetzt live auf:
**https://postray-xxxxx.vercel.app**

### Nächste Schritte:
- ✅ Teile den Link mit anderen
- ✅ Teste auf dem Handy
- ✅ Installier als PWA
- ✅ Erstelle echte Rayons

**Bei Fragen oder Problemen:** Schau in die Logs im Vercel Dashboard!

---

## 💰 Kosten

**Vercel Hobby Plan ist KOSTENLOS und reicht für:**
- 100 GB Bandwidth/Monat
- Unbegrenzte Requests
- Automatisches HTTPS
- CDN weltweit
- Git Integration
- Analytics

**Postgres Storage:**
- Erste 256 MB kostenlos
- Danach $0.10/GB pro Monat

Für kleine Projekte kostenlos! 🎊

