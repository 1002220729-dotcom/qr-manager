# QR Manager

שרת QR דינאמי — צור קישורי QR שניתן לעדכן בכל עת מבלי לשנות את הקוד המודפס.

## איך זה עובד

```
QR מודפס  →  yourdomain.com/r/abc123  →  (הפניה בשרת)  →  הכתובת האמיתית
```

הכתובת שמקודדת ב-QR לא משתנה לעולם. היעד מנוהל בשרת ואפשר לשנותו מתי שרוצים.

---

## התקנה מקומית

```bash
git clone https://github.com/<USER>/qr-manager.git
cd qr-manager
npm install
npm start
```

פתח את הדפדפן על `http://localhost:3000`

---

## פריסה ב-Railway (מומלץ)

1. צור חשבון ב-[railway.app](https://railway.app)
2. **New Project → Deploy from GitHub Repo**
3. בחר את ה-repo הזה
4. Railway יזהה את `package.json` ויריץ אוטומטית
5. לחץ על **Generate Domain** → תקבל כתובת ציבורית

### משתני סביבה (אופציונלי)

| משתנה | ברירת מחדל | תיאור |
|-------|------------|-------|
| `PORT` | `3000` | פורט השרת |
| `DB_PATH` | `./qr.db` | מיקום קובץ SQLite |

> **Railway tip:** צור Volume ב-Railway וקשר אותו ל-`/app/data`, ואז הגדר `DB_PATH=/app/data/qr.db` כדי שהמסד לא ימחק בין deploys.

---

## פריסה ב-Render

1. **New → Web Service → Connect GitHub repo**
2. Build command: `npm install`
3. Start command: `node server.js`
4. בחר **Free tier**
5. הוסף Disk בגודל 1GB עם Mount Path: `/data`
6. הגדר env var: `DB_PATH=/data/qr.db`

---

## API

| Method | Path | תיאור |
|--------|------|-------|
| `GET` | `/r/:code` | הפניה לכתובת היעד |
| `GET` | `/api/links` | כל הקישורים |
| `POST` | `/api/links` | יצירת קישור חדש |
| `PUT` | `/api/links/:code` | עדכון קישור |
| `DELETE` | `/api/links/:code` | מחיקת קישור |

### POST /api/links — body

```json
{
  "name": "עמוד הנחיתה שלי",
  "dest": "https://example.com/page",
  "active": true
}
```

---

## מבנה הפרויקט

```
qr-manager/
├── server.js        ← שרת Express + SQLite
├── package.json
├── .gitignore
├── public/
│   └── index.html   ← ממשק הניהול
└── README.md
```
