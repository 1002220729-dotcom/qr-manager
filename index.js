const HTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QR Manager</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f0; color: #1a1a1a; min-height: 100vh; padding: 2rem 1rem;
    }
    .container { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #888; margin-bottom: 1.5rem; }
    .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .stats { font-size: 13px; color: #888; }
    button {
      font-family: inherit; font-size: 13px; padding: 6px 14px;
      border: 0.5px solid #ccc; border-radius: 8px; background: #fff;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background 0.1s;
    }
    button:hover { background: #f0f0eb; }
    button.primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    button.primary:hover { background: #333; }
    button.danger { color: #c0392b; }
    button.danger:hover { background: #fdf0ee; border-color: #e0b0ad; }
    .card { background: #fff; border: 0.5px solid #e0e0d8; border-radius: 12px; padding: 1rem 1.25rem; }
    .link-card {
      background: #fff; border: 0.5px solid #e0e0d8; border-radius: 12px;
      padding: 1rem 1.25rem; margin-bottom: 10px;
      display: flex; gap: 14px; align-items: flex-start;
    }
    .qr-thumb { flex-shrink: 0; width: 80px; height: 80px; }
    .qr-thumb canvas, .qr-thumb img { border-radius: 4px; }
    .link-info { flex: 1; min-width: 0; }
    .link-name { font-weight: 500; font-size: 15px; margin-bottom: 3px; }
    .link-dest {
      font-size: 12px; font-family: monospace; color: #666;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 340px; margin-bottom: 3px;
    }
    .link-meta { font-size: 11px; color: #aaa; }
    .badge { display: inline-block; font-size: 11px; font-weight: 500; padding: 1px 8px; border-radius: 20px; margin-left: 6px; }
    .badge-active { background: #e6f4ee; color: #1a7a4a; }
    .badge-inactive { background: #f0f0eb; color: #888; }
    .actions { display: flex; gap: 2px; flex-shrink: 0; }
    .icon-btn {
      background: none; border: none; padding: 5px 6px;
      border-radius: 6px; cursor: pointer; color: #999; font-size: 18px; line-height: 1;
    }
    .icon-btn:hover { background: #f0f0eb; color: #333; }
    .icon-btn.danger:hover { background: #fdf0ee; color: #c0392b; }
    .empty-state { text-align: center; padding: 3rem 0; color: #bbb; font-size: 14px; }
    .modal-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.4); z-index: 100;
      align-items: center; justify-content: center; padding: 1rem;
    }
    .modal-overlay.open { display: flex; }
    .modal { background: #fff; border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 440px; }
    .modal h2 { font-size: 16px; font-weight: 500; margin-bottom: 1.25rem; }
    label { display: block; font-size: 13px; color: #555; margin-bottom: 4px; margin-top: 12px; }
    input[type=text], input[type=url] {
      width: 100%; padding: 8px 10px; font-size: 14px;
      border: 0.5px solid #ccc; border-radius: 8px;
      font-family: inherit; background: #fff; color: #1a1a1a; outline: none;
    }
    input:focus { border-color: #888; }
    .toggle-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .toggle-row input { width: 16px; height: 16px; cursor: pointer; }
    .toggle-row label { margin: 0; cursor: pointer; color: #333; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 1.25rem; }
    .hint { font-size: 12px; color: #aaa; margin-top: 4px; }
    .qr-preview-wrap { margin-top: 12px; }
    .qr-preview-wrap p { font-size: 12px; color: #aaa; margin-bottom: 6px; }
    .toast {
      display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #1a1a1a; color: #fff; padding: 8px 18px;
      border-radius: 20px; font-size: 13px; z-index: 200;
    }
  </style>
</head>
<body>
<div class="container">
  <div class="top-bar">
    <div>
      <h1>QR Manager</h1>
      <p class="subtitle" id="base-url-display"></p>
    </div>
    <button class="primary" onclick="openNew()">+ קישור חדש</button>
  </div>
  <p class="stats" id="stats-line">טוען...</p>
  <div style="margin-top:1rem;" id="list-area"></div>
</div>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal" id="modal-box"></div>
</div>
<div class="toast" id="toast"></div>

<script>
const BASE = window.location.origin;
let currentEditCode = null;
document.getElementById('base-url-display').textContent = BASE + '/r/:code';

async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: {'Content-Type':'application/json'},
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function redirectUrl(code) { return BASE + '/r/' + code; }

function renderQR(el, code, size=80) {
  el.innerHTML = '';
  try { new QRCode(el, { text: redirectUrl(code), width: size, height: size, correctLevel: QRCode.CorrectLevel.H }); }
  catch(e) { el.textContent = '!'; }
}

function downloadQR(code, name) {
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;';
  document.body.appendChild(tmp);
  new QRCode(tmp, { text: redirectUrl(code), width: 400, height: 400, correctLevel: QRCode.CorrectLevel.H });
  setTimeout(() => {
    const img = tmp.querySelector('img');
    if (img) { const a = document.createElement('a'); a.href = img.src; a.download = (name||code)+'.png'; a.click(); }
    document.body.removeChild(tmp);
  }, 200);
}

async function render() {
  let links = [];
  try { links = await api('GET', '/links'); } catch(e) { showToast('שגיאה בטעינה'); }
  const list = document.getElementById('list-area');
  document.getElementById('stats-line').textContent = links.length === 0 ? 'אין קישורים עדיין' : links.length + ' קישור' + (links.length === 1 ? '' : 'ים');

  if (links.length === 0) {
    list.innerHTML = '<div class="empty-state">⬛ צור את קישור ה-QR הראשון שלך</div>';
    return;
  }
  list.innerHTML = '';
  for (const item of links) {
    const card = document.createElement('div');
    card.className = 'link-card';
    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-thumb';
    card.appendChild(qrDiv);
    const info = document.createElement('div');
    info.className = 'link-info';
    info.innerHTML = \`
      <div class="link-name">
        \${esc(item.name)}
        <span class="badge \${item.active ? 'badge-active' : 'badge-inactive'}">\${item.active ? 'פעיל' : 'מושבת'}</span>
      </div>
      <div class="link-dest" title="\${esc(item.dest)}">\${esc(item.dest)}</div>
      <div class="link-meta">קוד: <code>\${item.code}</code> · \${new Date(item.created).toLocaleDateString('he-IL')} · \${item.hits} סריקות</div>
    \`;
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.innerHTML = \`
      <button class="icon-btn" onclick="openEdit('\${item.code}')" title="ערוך">✏️</button>
      <button class="icon-btn" onclick="downloadQR('\${item.code}','\${esc(item.name).replace(/'/g,'')}')" title="הורד">⬇️</button>
      <button class="icon-btn" onclick="copyLink('\${item.code}')" title="העתק">🔗</button>
      <button class="icon-btn danger" onclick="confirmDelete('\${item.code}','\${esc(item.name).replace(/'/g,'')}')" title="מחק">🗑️</button>
    \`;
    card.appendChild(info);
    card.appendChild(actions);
    list.appendChild(card);
    renderQR(qrDiv, item.code, 80);
  }
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function copyLink(code) { navigator.clipboard.writeText(redirectUrl(code)).catch(()=>{}); showToast('קישור הועתק'); }

function openNew() {
  currentEditCode = null;
  showModal(\`<h2>קישור QR חדש</h2>
    <label>שם תיאורי</label><input type="text" id="m-name" placeholder="למשל: עמוד הנחיתה שלי" />
    <label>כתובת יעד</label><input type="url" id="m-dest" placeholder="https://..." dir="ltr" />
    <p class="hint">ניתן לשנות בכל עת — ה-QR יישאר זהה</p>
    <div class="toggle-row"><input type="checkbox" id="m-active" checked /><label for="m-active">קישור פעיל</label></div>
    <div class="modal-actions"><button onclick="closeModal()">ביטול</button><button class="primary" onclick="saveNew()">צור קישור</button></div>\`);
}

async function openEdit(code) {
  currentEditCode = code;
  let item;
  try { item = (await api('GET', '/links')).find(l => l.code === code); } catch(e) { return; }
  if (!item) return;
  showModal(\`<h2>עריכת קישור</h2>
    <label>שם תיאורי</label><input type="text" id="m-name" value="\${esc(item.name)}" />
    <label>כתובת יעד</label><input type="url" id="m-dest" value="\${esc(item.dest)}" dir="ltr" />
    <p class="hint">שינוי יכנס לתוקף מיידית — ה-QR המודפס לא משתנה</p>
    <div class="toggle-row"><input type="checkbox" id="m-active" \${item.active ? 'checked' : ''} /><label for="m-active">קישור פעיל</label></div>
    <div class="qr-preview-wrap"><p>\${redirectUrl(code)}</p><div id="qr-preview"></div></div>
    <div class="modal-actions"><button onclick="closeModal()">ביטול</button><button class="primary" onclick="saveEdit()">שמור</button></div>\`);
  setTimeout(() => renderQR(document.getElementById('qr-preview'), code, 100), 50);
}

function confirmDelete(code, name) {
  currentEditCode = code;
  showModal(\`<h2>מחיקת קישור</h2>
    <p style="font-size:14px;color:#555;margin-bottom:1rem;">האם למחוק את "<strong>\${esc(name)}</strong>"?<br>ה-QR המודפס יפסיק לעבוד.</p>
    <div class="modal-actions"><button onclick="closeModal()">ביטול</button><button class="danger" onclick="doDelete()">מחק</button></div>\`);
}

async function saveNew() {
  const name = document.getElementById('m-name').value.trim();
  const dest = document.getElementById('m-dest').value.trim();
  const active = document.getElementById('m-active').checked;
  if (!name) { showToast('נא להזין שם'); return; }
  if (!dest) { showToast('נא להזין כתובת יעד'); return; }
  try { await api('POST', '/links', { name, dest, active }); closeModal(); render(); showToast('קישור נוצר!'); }
  catch(e) { showToast('שגיאה'); }
}

async function saveEdit() {
  const name = document.getElementById('m-name').value.trim();
  const dest = document.getElementById('m-dest').value.trim();
  const active = document.getElementById('m-active').checked;
  if (!name) { showToast('נא להזין שם'); return; }
  if (!dest) { showToast('נא להזין כתובת יעד'); return; }
  try { await api('PUT', '/links/' + currentEditCode, { name, dest, active }); closeModal(); render(); showToast('עודכן בהצלחה'); }
  catch(e) { showToast('שגיאה'); }
}

async function doDelete() {
  try { await api('DELETE', '/links/' + currentEditCode); closeModal(); render(); showToast('נמחק'); }
  catch(e) { showToast('שגיאה'); }
}

function showModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  currentEditCode = null;
}
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, 2200);
}

render();
</script>
</body>
</html>`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomCode() {
  const arr = new Uint8Array(3);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function cors() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── Worker ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return cors();

    // ── Redirect ─────────────────────────────────────────────────────────────
    if (path.startsWith('/r/')) {
      const code = path.slice(3);
      const item = await env.QR_KV.get('link:' + code, 'json');
      if (!item) return new Response('קישור לא נמצא', { status: 404 });
      if (!item.active) return new Response('קישור זה אינו פעיל', { status: 410 });
      await env.QR_KV.put('link:' + code, JSON.stringify({ ...item, hits: (item.hits || 0) + 1 }));
      return Response.redirect(item.dest, 302);
    }

    // ── GET /api/links ────────────────────────────────────────────────────────
    if (path === '/api/links' && method === 'GET') {
      const list = await env.QR_KV.list({ prefix: 'link:' });
      const items = await Promise.all(list.keys.map(k => env.QR_KV.get(k.name, 'json')));
      return json(items.filter(Boolean).sort((a, b) => b.created - a.created));
    }

    // ── POST /api/links ───────────────────────────────────────────────────────
    if (path === '/api/links' && method === 'POST') {
      const body = await request.json();
      if (!body.name || !body.dest) return json({ error: 'name and dest are required' }, 400);
      const code = randomCode();
      const now = Date.now();
      const item = {
        code,
        name: body.name.trim(),
        dest: body.dest.trim(),
        active: body.active !== false,
        created: now,
        updated: now,
        hits: 0,
      };
      await env.QR_KV.put('link:' + code, JSON.stringify(item));
      return json(item, 201);
    }

    // ── PUT /api/links/:code ──────────────────────────────────────────────────
    if (path.startsWith('/api/links/') && method === 'PUT') {
      const code = path.split('/')[3];
      const existing = await env.QR_KV.get('link:' + code, 'json');
      if (!existing) return json({ error: 'not found' }, 404);
      const body = await request.json();
      const updated = {
        ...existing,
        name:    body.name    !== undefined ? body.name.trim()    : existing.name,
        dest:    body.dest    !== undefined ? body.dest.trim()    : existing.dest,
        active:  body.active  !== undefined ? body.active         : existing.active,
        updated: Date.now(),
      };
      await env.QR_KV.put('link:' + code, JSON.stringify(updated));
      return json(updated);
    }

    // ── DELETE /api/links/:code ───────────────────────────────────────────────
    if (path.startsWith('/api/links/') && method === 'DELETE') {
      const code = path.split('/')[3];
      await env.QR_KV.delete('link:' + code);
      return json({ ok: true });
    }

    // ── Frontend ──────────────────────────────────────────────────────────────
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  },
};
