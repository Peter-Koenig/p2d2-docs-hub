---
title: Kontaktformular mit ALTCHA CAPTCHA
description: Implementierung eines sicheren Kontaktformulars mit DSGVO-konformem CAPTCHA-Schutz ohne Tracking
quality:
  completeness: 95
  accuracy: 100
  reviewed: true
  reviewer: Peter König (Perplexity - unterstützt)
  reviewDate: 2026-01-30
---

# [Kontaktformular](https://www.data-dna.eu/kontakt) mit ALTCHA CAPTCHA

> **Status:** ✅ Produktiv seit 30.01.2026

## Übersicht

Das p2d2-Kontaktformular ermöglicht Nutzern, direkt Kontakt mit dem Team aufzunehmen. Es ist durch **ALTCHA** geschützt – ein datenschutzfreundliches, DSGVO-konformes Anti-Spam-System ohne Tracking oder externe Cookies.

### Besonderheiten

- **Kein Google reCAPTCHA**: Keine Abhängigkeit von Google-Diensten
- **DSGVO-konform**: Keine personenbezogenen Daten an Dritte
- **Open Source**: ALTCHA ist vollständig Open Source
- **Proof-of-Work**: Challenge-Response-Verfahren statt KI-Erkennung
- **Barrierefrei**: Einfache Checkbox, keine komplexen Aufgaben

---

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  /kontakt (Astro Page)                          │    │
│  │  - Formular (Name, E-Mail, Betreff, Nachricht)  │    │
│  │  - ALTCHA Widget (<altcha-widget>)              │    │
│  └─────────────────────────────────────────────────┘    │
│                     ↓                ↑                  │
│              (1) Request     (2) Challenge              │
│                     ↓                ↑                  │
└─────────────────────────────────────────────────────────┘
                      ↓                ↑
┌─────────────────────────────────────────────────────────┐
│                   Server (Astro SSR)                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  GET /api/altcha/challenge                       │   │
│  │  - Generiert Challenge mit HMAC-Signatur         │   │
│  │  - Sendet { algorithm, challenge, salt, sig }    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  POST /api/contact-submit                        │   │
│  │  - Validiert Formulardaten                       │   │
│  │  - Verifiziert ALTCHA-Payload                    │   │
│  │  - Versendet E-Mail via SMTP                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Sicherheitsmaßnahmen

### 1. **ALTCHA Challenge-Response**

**Zweck:** Schutz vor automatisierten Spam-Bots

**Funktionsweise:**
1. Server generiert eine kryptografische Challenge (SHA-256)
2. Client (Widget) löst die Challenge durch Proof-of-Work
3. Server verifiziert die Lösung mit HMAC-Signatur

**Vorteile:**
- Keine IP-Adressen oder Tracking nötig
- Kein maschinelles Lernen (keine Trainingsdaten)
- Mathematisch nachweisbar sicher (HMAC-SHA256)

### 2. **Server-seitige Validierung**

**Input-Validierung:**
```typescript
// Pflichtfelder prüfen
if (!data.name?.trim() || !data.email?.trim() || 
    !data.subject?.trim() || !data.message?.trim()) {
  return error(400, "Fehlende Pflichtfelder");
}

// E-Mail-Format validieren
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(data.email)) {
  return error(400, "Ungültige E-Mail-Adresse");
}

// ALTCHA-Payload verifizieren
const isValid = await verifySolution(data.altcha, hmacKey);
if (!isValid) {
  return error(400, "CAPTCHA-Verifikation fehlgeschlagen");
}
```

### 3. **Umgebungsvariablen (Secrets)**

Alle sensiblen Daten werden über `astro:env/server` verwaltet:

```typescript
// astro.config.mjs
env: {
  schema: {
    // ALTCHA HMAC Key (32+ Bytes Hex)
    ALTCHA_HMAC_KEY: envField.string({
      context: "server",
      access: "secret",
    }),
    
    // SMTP-Konfiguration
    SMTP_HOST: envField.string({ context: "server", access: "secret" }),
    SMTP_PORT: envField.number({ context: "server", access: "secret" }),
    SMTP_USER: envField.string({ context: "server", access: "secret" }),
    SMTP_PASS: envField.string({ context: "server", access: "secret" }),
    
    // E-Mail-Adressen
    CONTACT_EMAIL_TO: envField.string({ context: "server", access: "secret" }),
    CONTACT_EMAIL_FROM: envField.string({ context: "server", access: "secret" }),
  }
}
```

**Typ-Sicherheit:** TypeScript garantiert zur Compile-Zeit, dass alle Secrets verfügbar sind.

### 4. **Rate Limiting (zukünftig)**

::: warning Geplant
Aktuell ist kein Rate Limiting implementiert. Für Production sollte ein Middleware-Layer ergänzt werden:
- Max. 5 Anfragen pro IP/Stunde
- Exponentielles Backoff bei wiederholten Fehlern
:::

### 5. **Content Security Policy (CSP)**

Das ALTCHA Widget wird lokal geladen (nicht von CDN), um CSP-Regeln einzuhalten:

```typescript
// src/scripts/init-altcha.ts
import 'altcha'; // Lokaler Import statt CDN
```

**Vorteile:**
- Keine externen Abhängigkeiten zur Laufzeit
- CSP `script-src 'self'` möglich
- Kontrolle über Code-Integrität

---

## Implementierung

### Dateien-Struktur

```
src/
├── pages/
│   ├── kontakt.astro                 # Kontaktformular-Seite
│   └── api/
│       ├── altcha/
│       │   └── challenge.ts          # Challenge-Generator
│       └── contact-submit.ts         # Form-Handler & E-Mail-Versand
├── scripts/
│   └── init-altcha.ts                # ALTCHA Widget-Import
└── env.d.ts                          # TypeScript Env-Definitionen
```

### 1. Challenge-Endpoint

**Datei:** `src/pages/api/altcha/challenge.ts`

```typescript
import type { APIRoute } from "astro";
import { createChallenge } from "altcha-lib";
import { ALTCHA_HMAC_KEY } from "astro:env/server";

export const GET: APIRoute = async () => {
  try {
    const hmacKey = ALTCHA_HMAC_KEY;
    if (!hmacKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Challenge erstellen
    const challengeData = createChallenge({
      algorithm: "SHA-256",
      maxnumber: 50000,
      hmacKey,
    });

    // Response filtern: Widget erwartet nur 4 Felder
    const response = {
      algorithm: challengeData.algorithm,
      challenge: challengeData.challenge,
      salt: challengeData.salt,
      signature: challengeData.signature,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating ALTCHA challenge:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Wichtig:** Das Feld `maxnumber` wird NICHT an das Widget gesendet, da dies zu Parse-Fehlern führt.

### 2. Formular-Seite

**Datei:** `src/pages/kontakt.astro`

**HTML (Auszug):**
```html
<form method="POST" action="/api/contact-submit">
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required />
  </div>
  
  <div>
    <label for="email">E-Mail</label>
    <input type="email" id="email" name="email" required />
  </div>
  
  <div>
    <label for="subject">Betreff</label>
    <select id="subject" name="subject" required>
      <option value="">Bitte wählen...</option>
      <option value="mitmachen">Ich möchte mitmachen</option>
      <option value="kommune">Interesse als Kommune</option>
      <option value="technical">Technische Frage</option>
      <option value="other">Sonstiges</option>
    </select>
  </div>
  
  <div>
    <label for="message">Nachricht</label>
    <textarea id="message" name="message" rows="5" required></textarea>
  </div>
  
  <!-- ALTCHA Widget -->
  <div class="mb-6">
    <altcha-widget 
      id="altcha-captcha"
      challengeurl="/api/altcha/challenge"
    ></altcha-widget>
  </div>
  
  <button type="submit">Nachricht senden</button>
</form>

<!-- Widget-Import -->
<script type="module" src="/src/scripts/init-altcha.ts"></script>
```

**JavaScript (Event-Driven):**
```javascript
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const widget = document.getElementById('altcha-captcha');
    
    let altchaPayload = null;
    
    // Event-Listener: CAPTCHA gelöst
    widget.addEventListener('statechange', (event) => {
      if (event.detail?.state === 'verified') {
        altchaPayload = event.detail?.payload;
        console.log('✅ CAPTCHA gelöst! Payload Länge:', altchaPayload?.length);
      } else if (event.detail?.state === 'error') {
        altchaPayload = null;
      }
    });
    
    // Form-Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validierung: CAPTCHA muss gelöst sein
      if (!altchaPayload) {
        alert('❌ Bitte löse das CAPTCHA.');
        return;
      }
      
      // Formulardaten sammeln
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.altcha = altchaPayload; // Payload hinzufügen
      
      try {
        const response = await fetch('/api/contact-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          alert('✅ Nachricht erfolgreich gesendet!');
          form.reset();
          altchaPayload = null;
          if (widget.reset) widget.reset();
        } else {
          alert('❌ Fehler: ' + (result.error || 'Unbekannter Fehler'));
        }
      } catch (error) {
        console.error('Netzwerkfehler:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
      }
    });
  });
</script>
```

### 3. Submit-Handler

**Datei:** `src/pages/api/contact-submit.ts`

```typescript
import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { verifySolution } from "altcha-lib";
import {
  ALTCHA_HMAC_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  CONTACT_EMAIL_TO,
  CONTACT_EMAIL_FROM,
} from "astro:env/server";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // 1. Validierung: Pflichtfelder
    if (!data.name?.trim() || !data.email?.trim() || 
        !data.subject?.trim() || !data.message?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Fehlende Pflichtfelder" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 2. E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Ungültige E-Mail" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 3. ALTCHA verifizieren
    if (!data.altcha) {
      return new Response(
        JSON.stringify({ success: false, error: "CAPTCHA fehlt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const isValid = await verifySolution(data.altcha, ALTCHA_HMAC_KEY);
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "CAPTCHA ungültig" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 4. E-Mail versenden
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    
    const subjectMap = {
      mitmachen: "Ich möchte mitmachen",
      kommune: "Interesse als Kommune",
      technical: "Technische Frage",
      other: "Sonstiges",
    };
    
    await transporter.sendMail({
      from: CONTACT_EMAIL_FROM,
      to: CONTACT_EMAIL_TO,
      replyTo: `${data.name} <${data.email}>`,
      subject: `[p2d2 Kontakt] ${subjectMap[data.subject] || data.subject}`,
      text: `Neue Kontaktanfrage über p2d2\n\n` +
            `Name: ${data.name}\n` +
            `E-Mail: ${data.email}\n` +
            `Betreff: ${subjectMap[data.subject] || data.subject}\n\n` +
            `Nachricht:\n${data.message}\n\n---\n` +
            `Gesendet: ${new Date().toISOString()}\n` +
            `IP: ${request.headers.get("x-forwarded-for") || "unknown"}`,
      html: `<h2>Neue Kontaktanfrage über p2d2</h2>
             <table style="border-collapse: collapse;">
               <tr><td><strong>Name</strong></td><td>${data.name}</td></tr>
               <tr><td><strong>E-Mail</strong></td><td>${data.email}</td></tr>
               <tr><td><strong>Betreff</strong></td><td>${subjectMap[data.subject]}</td></tr>
             </table>
             <h3>Nachricht:</h3>
             <div style="background: #f9f9f9; padding: 12px;">
               ${data.message}
             </div>`,
    });
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Form submission error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### 4. Widget-Import

**Datei:** `src/scripts/init-altcha.ts`

```typescript
/**
 * ALTCHA Web Component Import
 * Muss als separate Datei existieren, damit Vite den bare import auflösen kann.
 */
import 'altcha';

console.log('✅ ALTCHA Web Component geladen');
```

---

## Konfiguration

### Umgebungsvariablen (.env)

```bash
# ALTCHA HMAC Key (generieren mit: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ALTCHA_HMAC_KEY=a1b2c3d4e5f6789...  # 64 Zeichen Hex

# SMTP-Server
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASS=your_password

# E-Mail-Adressen
CONTACT_EMAIL_TO=team@data-dna.eu
CONTACT_EMAIL_FROM=p2d2-dev@scanea.de

# Optional: Debug-Modus
APP_DEBUG=false
```

### HMAC Key generieren

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a1b2c3d4e5f6789... (64 Zeichen)
```

---

## Abhängigkeiten

```json
{
  "dependencies": {
    "altcha": "^0.6.3",           // Widget (Browser)
    "altcha-lib": "^0.5.0",       // Server-Library
    "nodemailer": "^6.9.8"        // E-Mail-Versand
  }
}
```

**Installation:**
```bash
npm install altcha altcha-lib nodemailer
```

---

## Testing

### Manueller Test

1. **Development-Server starten:**
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

2. **Formular öffnen:** `http://localhost:4321/kontakt`

3. **Browser DevTools öffnen:** Console + Network-Tab

4. **CAPTCHA lösen:** Checkbox anklicken

5. **Erwartete Console-Logs:**
   ```
   ✅ ALTCHA Web Component geladen
   ✅ Kontaktformular wird initialisiert
   🔔 ALTCHA State Change: verifying
   🔔 ALTCHA State Change: verified
   ✅ CAPTCHA gelöst! Payload Länge: 150+
   ```

6. **Formular absenden:** Daten eingeben + "Senden"

7. **Erwartete Response:** Status 200 OK, Success-Message

8. **E-Mail prüfen:** Inbox von `CONTACT_EMAIL_TO`

### Fehlerszenarien testen

| Szenario | Erwartetes Verhalten |
|----------|---------------------|
| CAPTCHA nicht gelöst | Alert: "Bitte löse das CAPTCHA" |
| Leere Felder | Status 400, "Fehlende Pflichtfelder" |
| Ungültige E-Mail | Status 400, "Ungültige E-Mail" |
| Falscher HMAC Key | Status 400, "CAPTCHA ungültig" |
| SMTP-Fehler | Status 500, "Server error" |

---

## Troubleshooting

### Problem: Widget lädt nicht

**Symptom:** `<altcha-widget>` bleibt unsichtbar

**Lösung:**
```bash
# Prüfe ob altcha installiert ist
ls node_modules/altcha/

# Falls nicht:
npm install altcha

# Server neu starten
npm run dev
```

### Problem: "TypeError: can't access property 'split'"

**Ursache:** Challenge-Response enthält `maxnumber`-Feld

**Lösung:** Siehe [Challenge-Endpoint](#1-challenge-endpoint) – Response muss gefiltert werden

### Problem: CAPTCHA-Verifikation schlägt fehl

**Ursache:** HMAC Key fehlt oder ist falsch

**Lösung:**
```bash
# Prüfe .env
grep ALTCHA_HMAC_KEY .env

# Generiere neuen Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Füge zur .env hinzu
echo "ALTCHA_HMAC_KEY=<key>" >> .env

# Server NEU starten!
```

### Problem: E-Mail kommt nicht an

**Checkliste:**
- [ ] SMTP-Credentials korrekt in `.env`?
- [ ] Firewall blockiert Port 587/465?
- [ ] Spam-Ordner prüfen
- [ ] Server-Logs prüfen: `console.error` bei `sendMail()`

---

## Best Practices

### 1. **Secrets niemals committen**

```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. **TypeScript-Typen nutzen**

```typescript
// Astro garantiert Verfügbarkeit zur Compile-Zeit
import { ALTCHA_HMAC_KEY } from "astro:env/server";
// ✅ TypeScript wirft Fehler, wenn Variable fehlt
```

### 3. **Error Handling**

Immer Try-Catch verwenden:
```typescript
try {
  await transporter.sendMail({ ... });
} catch (error) {
  console.error("Mail error:", error);
  return new Response(JSON.stringify({ error: "..." }), { status: 500 });
}
```

### 4. **Input Sanitization**

```typescript
// HTML-Tags escapen in E-Mails
import { escapeHtml } from 'some-sanitizer-lib';
const safeMessage = escapeHtml(data.message);
```

### 5. **Rate Limiting (Production)**

Ergänze Middleware:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5, // Max 5 Requests
});

export const POST: APIRoute = limiter(async ({ request }) => {
  // ...
});
```

---

## Weiterführende Links

- **ALTCHA Dokumentation:** [https://altcha.org/docs](https://altcha.org/docs)
- **Astro Env:** [https://docs.astro.build/en/reference/configuration-reference/#env](https://docs.astro.build/en/reference/configuration-reference/#env)
- **Nodemailer:** [https://nodemailer.com/](https://nodemailer.com/)
- **DSGVO-Konformität:** [https://gdpr.eu/](https://gdpr.eu/)

---

## Changelog

| Datum | Version | Änderungen |
|-------|---------|-----------|
| 2026-01-30 | 1.0.0 | Initial Release – Produktiv |
| 2026-01-30 | 0.9.0 | Bugfix: Widget-Import lokal statt CDN |
| 2026-01-30 | 0.8.0 | Umstellung auf `astro:env` |
| 2026-01-29 | 0.1.0 | Erste Implementierung mit ALTCHA |

---

## Lizenz

Dieses Feature ist Teil von **p2d2 - Public-Public Data-DNA** und steht unter der **GNU General Public License v3.0** (GPLv3).

ALTCHA ist Open Source und steht unter der **MIT License**.
