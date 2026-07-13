# Deployment Guide — Vigenère Cipher System

This folder is deployment-ready: `server.js` now reads all config from
environment variables (PORT, HOST, DB credentials) instead of hardcoded
values. Works locally (XAMPP) and on any host (WebHostMost, Render, Railway)
with zero code changes — just set the env vars.

## 1. Local development (XAMPP)

1. Copy `.env.example` → `.env`
2. Leave defaults as-is (`DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=`)
3. Start MySQL in XAMPP, import `database.sql` via phpMyAdmin
4. `npm install`
5. `npm run dev` (nodemon) or `npm start`
6. Open `http://localhost:3000`

## 2. WebHostMost (free Node.js hosting)

1. Sign up at webhostmost.com — free plan, no credit card
2. **File Manager** → `domains/yourdomain.com/public_html` → delete the
   default `index.html` that's there before uploading your app
3. **MySQL Databases** section → create a database + user → note the
   host/user/password/database name → import `database.sql` via phpMyAdmin
4. Zip this whole `server_ready` folder **without** `node_modules`
   (there isn't one yet anyway — it gets installed on their server)
5. Upload the zip to `public_html` (or a subfolder) via File Manager, extract it
6. **Node.js App** section in the panel:
   - Node.js version: pick any recent LTS
   - Application root: the folder you extracted to
   - Application startup file: `server.js`
   - Mode: Production
7. In the panel's **Environment Variables** field, add:
   ```
   HOST=127.0.0.1
   DB_HOST=<from step 3>
   DB_USER=<from step 3>
   DB_PASSWORD=<from step 3>
   DB_NAME=<from step 3>
   DB_PORT=3306
   DB_SSL=false
   ```
   (Leave `PORT` unset — WebHostMost's Node.js selector assigns it automatically.)
8. Click **Run NPM Install** in the panel
9. **Manage Applications** → **Restart**
10. Visit your domain/subdomain and test encrypt/decrypt
11. If something's off, check **View Logs** in the Node.js App section

## 3. Render + TiDB Cloud (alternative free option)

1. Push this folder to a GitHub repo (`.gitignore` already excludes
   `node_modules` and `.env`)
2. TiDB Cloud → create a free serverless cluster → run `database.sql`
   against it → note host/port/user/password
3. Render → New Web Service → connect the repo
   - Build command: `npm install`
   - Start command: `node server.js`
4. In Render's Environment tab, set the same variables as above, but:
   - `HOST=0.0.0.0` (Render, unlike WebHostMost, expects this)
   - `DB_SSL=true` (TiDB Cloud requires SSL)
5. Deploy — Render gives you a live `.onrender.com` URL

## Notes

- Never commit `.env` — it's already in `.gitignore`
- `.env.example` is just a template; copy it, don't rename it, when setting
  real credentials locally
- The cipher logic and API routes (`/api/encrypt`, `/api/decrypt`,
  `/api/history`) are unchanged — only the config wiring is new
