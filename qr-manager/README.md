# QR Manager — Cloudflare Workers

שרת QR דינאמי על Cloudflare Workers + KV Storage.

## דרישות מוקדמות

- חשבון Cloudflare (חינמי)
- Node.js מותקן

---

## הגדרה ראשונית (פעם אחת)

### 1. התקן את Wrangler

```bash
npm install
npx wrangler login
```

הדפדפן יפתח לאישור — אשר את ההרשאות.

### 2. צור KV Namespace

```bash
npx wrangler kv:namespace create QR_KV
```

הפקודה תחזיר משהו כזה:

```
{ binding = "QR_KV", id = "abc123def456..." }
```

העתק את ה-`id` ופתח את `wrangler.toml` — הדבק את ה-id בשדה המתאים:

```toml
[[kv_namespaces]]
binding = "QR_KV"
id = "abc123def456..."          # ← כאן
preview_id = "abc123def456..."  # ← ואותו דבר כאן (לפיתוח מקומי)
```

### 3. פרוס

```bash
npx wrangler deploy
```

תקבל כתובת בסגנון: `https://qr-manager.<YOUR_SUBDOMAIN>.workers.dev`

---

## פיתוח מקומי

```bash
npm run dev
```

פתח `http://localhost:8787`

---

## מבנה הפרויקט

```
qr-manager-cf/
├── src/
│   └── index.js     ← Worker: ניהול routes + HTML הממשק
├── wrangler.toml    ← הגדרות Cloudflare
├── package.json
└── README.md
```

## API

| Method | Path | תיאור |
|--------|------|-------|
| `GET` | `/r/:code` | הפניה לכתובת היעד |
| `GET` | `/api/links` | כל הקישורים |
| `POST` | `/api/links` | יצירת קישור |
| `PUT` | `/api/links/:code` | עדכון קישור |
| `DELETE` | `/api/links/:code` | מחיקת קישור |
