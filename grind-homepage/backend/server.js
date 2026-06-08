const crypto = require("crypto");
const fs = require("fs/promises");
const fsSync = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, "..");
const ASSETS_DIR = path.join(ROOT_DIR, "..", "assets");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const sessions = new Set();

function loadEnvFile(filePath) {
  if (!fsSync.existsSync(filePath)) return;

  const content = fsSync.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...value] = trimmed.split("=");
    if (key && process.env[key] === undefined) {
      process.env[key] = value.join("=").trim();
    }
  });
}

const seedProducts = [
  {
    id: "grind-pusa-2026",
    name: "GRIND pusa 2026",
    description: "Soe ja vastupidav pusa, mis sobib nii rulaparki kui igapäevaseks kandmiseks.",
    image: "../assets/transparent-bg/pusa 1.png",
    price: 79.9,
    category: "riietus",
    sizes: ["XS", "S", "M", "L", "XL"],
    brand: "GRIND",
    productCode: "GRD-PUSA-2601",
    styleCode: "GP26-BLK-A"
  },
  {
    id: "butterco-mustad-teksad-2026",
    name: "BUTTER'CO teksad 2026",
    description: "Laiema lõikega mustad teksad, mis annavad sõitmiseks ruumi ja hoiavad tänavastiili puhtana.",
    image: "../assets/transparent-bg/teksad1.png",
    price: 89.9,
    category: "riietus",
    sizes: ["28", "30", "32", "34", "36"],
    brand: "BUTTER'CO",
    productCode: "BTR-DNM-2602",
    styleCode: "BC26-BLK-DNM"
  },
  {
    id: "starshoe-tossud-2026",
    name: "STARSHOE tossud 2026",
    description: "Tugeva tallaga skate-tossud igapäevaseks sõiduks ja tänavastiiliks.",
    image: "../assets/transparent-bg/tossud1.png",
    price: 129.9,
    category: "tossud",
    sizes: ["EU 7.5", "EU 8", "EU 9", "EU 9.5", "EU 11"],
    brand: "STARSHOE",
    productCode: "STR-SHOE-2605",
    styleCode: "SS26-BLK-WHT"
  },
  {
    id: "butterco-rula-valge-2022",
    name: "BUTTER'CO rula Valge 2022",
    description: "Valge graafikaga complete-rula alustavale ja edasijõudnud sõitjale.",
    image: "../assets/transparent-bg/rulkatoode1.png",
    price: 119.9,
    category: "rulad",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"],
    brand: "BUTTER'CO",
    productCode: "BTR-SKB-2201",
    styleCode: "BC22-WHT-CMP"
  },
  {
    id: "butterco-rula-must-2026",
    name: "BUTTER'CO rula Must 2026",
    description: "Must complete-rula tugeva graafika ja kindla sõidutundega.",
    image: "../assets/transparent-bg/rula4.png",
    price: 134.9,
    category: "rulad",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"],
    brand: "BUTTER'CO",
    productCode: "BTR-SKB-2603",
    styleCode: "BC26-BLK-CMP"
  }
];

function requireConfigValue(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return process.env[name];
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${key}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, key] = String(storedHash).split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function createSessionToken() {
  const raw = crypto.randomBytes(24).toString("hex");
  const signature = crypto
    .createHmac("sha256", requireConfigValue("SESSION_SECRET"))
    .update(raw)
    .digest("hex");
  return `${raw}.${signature}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureDatabase() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  requireConfigValue("SESSION_SECRET");
  const adminUsername = requireConfigValue("ADMIN_USERNAME");
  const adminPassword = requireConfigValue("ADMIN_PASSWORD");

  try {
    await fs.access(DB_FILE);
  } catch {
    const now = new Date().toISOString();
    await writeDb({
      meta: {
        name: "Grind JSON database",
        createdAt: now,
        updatedAt: now
      },
      admins: [
        {
          username: adminUsername,
          passwordHash: hashPassword(adminPassword)
        }
      ],
      products: seedProducts,
      contacts: []
    });
    return;
  }

  const db = JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  db.admins = Array.isArray(db.admins) ? db.admins : [];
  const admin = db.admins.find((user) => user.username === adminUsername);

  if (!admin) {
    db.admins.push({
      username: adminUsername,
      passwordHash: hashPassword(adminPassword)
    });
    await writeDb(db);
    return;
  }

  if (!verifyPassword(adminPassword, admin.passwordHash)) {
    admin.passwordHash = hashPassword(adminPassword);
    await writeDb(db);
  }
}

async function readDb() {
  await ensureDatabase();
  return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
}

async function writeDb(db) {
  db.meta = db.meta || {};
  db.meta.updatedAt = new Date().toISOString();
  await fs.writeFile(DB_FILE, `${JSON.stringify(db, null, 2)}\n`);
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      })
  );
}

function createCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Lax"];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

function getCsrfToken(req) {
  return parseCookies(req).csrf_token || crypto.randomBytes(24).toString("hex");
}

function csrfInput(token) {
  return `<input type="hidden" name="_csrf" value="${escapeHtml(token)}">`;
}

function csrfHeaders(req) {
  const token = getCsrfToken(req);
  return {
    token,
    headers: {
      "Set-Cookie": createCookie("csrf_token", token)
    }
  };
}

function verifyCsrf(req, form) {
  const token = parseCookies(req).csrf_token;
  return Boolean(token && form._csrf && token === form._csrf);
}

function isLoggedIn(req) {
  return sessions.has(parseCookies(req).grind_session);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function sendHtml(res, html, statusCode = 200, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    ...headers
  });
  res.end(html);
}

function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function readForm(req) {
  const body = await readBody(req);
  return Object.fromEntries(new URLSearchParams(body));
}

function pageLayout(title, content) {
  return `<!doctype html>
<html lang="et">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --black: #050505;
      --dark: #202020;
      --text: #0b0b0b;
      --muted: #666666;
      --line: #d7d7d7;
      --red: #e31828;
      --soft: #f5f5f5;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: #ffffff;
      color: var(--text);
      font-family: Inter, Arial, Helvetica, sans-serif;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button,
    input,
    textarea {
      font: inherit;
    }

    .backend-header {
      position: sticky;
      top: 0;
      z-index: 5;
      display: grid;
      grid-template-rows: 54px 30px;
      align-items: center;
      min-height: 84px;
      background: #ffffff;
      border-bottom: 1px solid #111111;
    }

    .backend-brand {
      justify-self: center;
      color: #000000;
      font-size: 51px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .backend-brand span {
      color: #dc5b48;
    }

    .backend-nav {
      display: flex;
      justify-content: center;
      gap: clamp(16px, 2vw, 34px);
      padding: 0 24px 8px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .backend-nav a {
      position: relative;
      padding-bottom: 4px;
    }

    .backend-nav a::after {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 2px;
      background: var(--red);
      content: "";
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 180ms ease;
    }

    .backend-nav a:hover::after {
      transform: scaleX(1);
    }

    .backend-shell {
      width: min(1180px, calc(100% - 40px));
      margin: 0 auto;
      padding: 54px 0 80px;
    }

    .hero-card {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      padding: 28px;
      background: var(--black);
      color: #ffffff;
    }

    .hero-card h1 {
      margin: 0;
      font-size: clamp(34px, 6vw, 72px);
      font-weight: 900;
      line-height: .9;
      letter-spacing: -.06em;
      text-transform: uppercase;
    }

    .hero-card p {
      max-width: 460px;
      margin: 10px 0 0;
      color: #d8d8d8;
      font-size: 14px;
      line-height: 1.6;
    }

    .panel {
      margin-bottom: 28px;
      padding: 26px;
      border: 1px solid var(--line);
      background: #ffffff;
      box-shadow: 0 18px 40px rgba(0, 0, 0, .07);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 16px;
    }

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .button,
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      border: 1px solid #111111;
      background: #111111;
      color: #ffffff;
      padding: 0 18px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 180ms ease, color 180ms ease, transform 180ms ease;
    }

    .button:hover,
    button:hover {
      background: var(--red);
      border-color: var(--red);
      transform: translateY(-1px);
    }

    .button.secondary {
      background: #ffffff;
      color: #111111;
    }

    .button.secondary:hover {
      background: #111111;
      color: #ffffff;
    }

    .button.danger,
    button.danger {
      background: #ffffff;
      color: var(--red);
      border-color: var(--red);
    }

    .button.danger:hover,
    button.danger:hover {
      background: var(--red);
      color: #ffffff;
    }

    .product-list,
    .message-list,
    .product-grid {
      display: grid;
      gap: 14px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .product-row,
    .message-row {
      display: grid;
      grid-template-columns: 72px 1fr auto;
      align-items: center;
      gap: 18px;
      padding: 14px;
      background: var(--soft);
      border: 1px solid #ededed;
    }

    .message-row {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .product-row img,
    .product-card img,
    .product-detail-image {
      width: 72px;
      height: 72px;
      object-fit: contain;
      filter: drop-shadow(0 12px 16px rgba(0, 0, 0, .18));
    }

    .product-title,
    .message-title {
      margin: 0 0 5px;
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .meta,
    .message-meta {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }

    .product-grid {
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    }

    .product-card {
      min-height: 100%;
      padding: 22px;
      background: #ffffff;
      border: 1px solid var(--line);
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .product-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 35px rgba(0, 0, 0, .09);
    }

    .product-card img {
      width: 100%;
      height: 190px;
      margin-bottom: 18px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    label {
      display: grid;
      gap: 8px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid #111111;
      background: #ffffff;
      padding: 13px 14px;
      font-size: 14px;
      font-weight: 600;
      text-transform: none;
    }

    textarea {
      min-height: 150px;
      resize: vertical;
    }

    .wide {
      grid-column: 1 / -1;
    }

    .detail-layout {
      display: grid;
      grid-template-columns: minmax(220px, 360px) 1fr;
      gap: 32px;
      align-items: start;
    }

    .product-detail-image {
      width: 100%;
      height: 360px;
      background: var(--soft);
      padding: 26px;
    }

    .empty {
      margin: 0;
      padding: 18px;
      background: var(--soft);
      color: var(--muted);
      font-weight: 700;
    }

    @media (max-width: 760px) {
      .backend-header {
        position: relative;
        grid-template-rows: auto auto;
        padding-top: 10px;
      }

      .backend-brand {
        font-size: 42px;
      }

      .backend-nav {
        flex-wrap: wrap;
        row-gap: 10px;
        padding-bottom: 14px;
      }

      .backend-shell {
        width: min(100% - 24px, 1180px);
        padding-top: 28px;
      }

      .product-row,
      .detail-layout,
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header class="backend-header">
    <a class="backend-brand" href="/" aria-label="Grind avaleht">Gr<span>i</span>nd</a>
    <nav class="backend-nav" aria-label="Backend menüü">
      <a href="/">Pood</a>
      <a href="/backend/tooted">Backend tooted</a>
      <a href="/admin">Admin</a>
    </nav>
  </header>
  <main class="backend-shell">
    ${content}
  </main>
</body>
</html>`;
}

function productForm(product = {}, csrfToken = "") {
  return `<form method="post" class="panel">
    ${csrfInput(csrfToken)}
    <div class="panel-header">
      <h2>Toote andmed</h2>
      <a class="button secondary" href="/admin">Tagasi</a>
    </div>
    <div class="form-grid">
      <label>Nimi<input name="name" value="${escapeHtml(product.name)}" required></label>
      <label>Hind<input name="price" type="number" step="0.01" value="${escapeHtml(product.price || "")}" required></label>
      <label class="wide">Kirjeldus<textarea name="description" rows="5" required>${escapeHtml(product.description)}</textarea></label>
      <label class="wide">Pildi tee<input name="image" value="${escapeHtml(product.image || "../assets/transparent-bg/tossud1.png")}" required></label>
      <label>Kategooria<input name="category" value="${escapeHtml(product.category || "riietus")}" required></label>
      <label>Suurused (komaga eraldatud)<input name="sizes" value="${escapeHtml((product.sizes || []).join(", "))}" required></label>
      <label>Bränd<input name="brand" value="${escapeHtml(product.brand || "")}" required></label>
      <label>Tootekood<input name="productCode" value="${escapeHtml(product.productCode || "")}" required></label>
      <label>Stiilikood<input name="styleCode" value="${escapeHtml(product.styleCode || "")}" required></label>
    </div>
    <div class="actions" style="margin-top: 20px;">
      <button type="submit">Salvesta</button>
    </div>
  </form>`;
}

function productFromForm(form, existingId) {
  return {
    id: existingId || slugify(`${form.brand}-${form.name}-${Date.now()}`),
    name: form.name.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    price: Number(form.price),
    category: form.category.trim(),
    sizes: form.sizes.split(",").map((size) => size.trim()).filter(Boolean),
    brand: form.brand.trim(),
    productCode: form.productCode.trim(),
    styleCode: form.styleCode.trim()
  };
}

function validateProductForm(form) {
  const required = ["name", "description", "image", "price", "category", "sizes", "brand", "productCode", "styleCode"];
  const missing = required.filter((field) => !String(form[field] || "").trim());
  const price = Number(form.price);

  if (missing.length) return `Puuduvad väljad: ${missing.join(", ")}`;
  if (!Number.isFinite(price) || price <= 0) return "Hind peab olema positiivne number.";
  if (!form.sizes.split(",").map((size) => size.trim()).filter(Boolean).length) return "Lisa vähemalt üks suurus.";
  if (!/^[\w./ -]+$/.test(form.image)) return "Pildi tee sisaldab lubamatuid märke.";

  return "";
}

function validateContactForm(form) {
  if (!String(form.name || "").trim()) return "Nimi on kohustuslik.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || ""))) return "E-mail ei ole korrektne.";
  if (!String(form.message || "").trim()) return "Sõnum on kohustuslik.";
  if (String(form.phone || "").length > 40) return "Telefoninumber on liiga pikk.";
  return "";
}

function requireAdmin(req, res) {
  if (isLoggedIn(req)) return true;
  redirect(res, "/admin/login");
  return false;
}

async function serveStatic(req, res, pathname) {
  const baseDir = pathname.startsWith("/assets/") ? ASSETS_DIR : ROOT_DIR;
  const relativePath = pathname.startsWith("/assets/") ? pathname.replace(/^\/assets\//, "") : (pathname === "/" ? "index.html" : pathname);
  const filePath = path.normalize(path.join(baseDir, relativePath));

  if (!filePath.startsWith(baseDir)) {
    sendHtml(res, "Keelatud", 403);
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".jfif": "image/jpeg"
    }[ext] || "application/octet-stream";
    if (pathname === "/kontaktivorm.html") {
      const csrf = csrfHeaders(req);
      const html = file.toString("utf8").replace(
        '<form class="contact-form" action="/contact" method="post">',
        `<form class="contact-form" action="/contact" method="post">${csrfInput(csrf.token)}`
      );
      sendHtml(res, html, 200, csrf.headers);
      return;
    }

    res.writeHead(200, { "Content-Type": type });
    res.end(file);
  } catch {
    sendHtml(res, "Lehte ei leitud", 404);
  }
}

async function handleAdmin(req, res, url) {
  const db = await readDb();

  if (url.pathname === "/admin/login" && req.method === "GET") {
    const csrf = csrfHeaders(req);
    sendHtml(res, pageLayout("Admin login", `<section class="hero-card">
        <div>
          <h1>Admin</h1>
          <p>Logi sisse, et hallata tooteid ja vaadata kontaktivormi sõnumeid.</p>
        </div>
      </section>
      <form method="post" class="panel">
        <div class="panel-header">
          <h2>Sisselogimine</h2>
        </div>
        ${csrfInput(csrf.token)}
        <div class="form-grid">
          <label>Kasutajanimi<input name="username" required></label>
          <label>Parool<input name="password" type="password" required></label>
        </div>
        <div class="actions" style="margin-top: 20px;">
          <button type="submit">Logi sisse</button>
        </div>
      </form>`), 200, csrf.headers);
    return;
  }

  if (url.pathname === "/admin/login" && req.method === "POST") {
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    const admin = db.admins.find((user) => user.username === form.username && verifyPassword(form.password || "", user.passwordHash));

    if (!admin) {
      sendHtml(res, pageLayout("Admin login", `<section class="panel">
        <h2>Vale kasutajanimi või parool</h2>
        <p class="empty">Kontrolli .env failis olevat kasutajanime ja parooli.</p>
        <div class="actions" style="margin-top: 18px;"><a class="button" href="/admin/login">Proovi uuesti</a></div>
      </section>`), 401);
      return;
    }

    const session = createSessionToken();
    sessions.add(session);
    res.writeHead(302, {
      Location: "/admin",
      "Set-Cookie": `grind_session=${session}; Path=/; HttpOnly; SameSite=Lax`
    });
    res.end();
    return;
  }

  if (url.pathname === "/admin/logout" && req.method === "POST") {
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    sessions.delete(parseCookies(req).grind_session);
    res.writeHead(302, {
      Location: "/admin/login",
      "Set-Cookie": "grind_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    });
    res.end();
    return;
  }

  if (url.pathname === "/admin/login" && req.method === "POST") return;

  if (url.pathname === "/admin" || url.pathname === "/admin/products") {
    if (!requireAdmin(req, res)) return;
    const csrf = csrfHeaders(req);
    const rows = db.products.map((product) => `<li class="product-row">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <div>
        <p class="product-title">${escapeHtml(product.name)}</p>
        <p class="meta">${escapeHtml(product.category)} | ${escapeHtml(product.productCode)} | ${product.price.toFixed(2)}€</p>
      </div>
      <div class="actions">
        <a class="button secondary" href="/admin/products/${product.id}/edit">Muuda</a>
        <form method="post" action="/admin/products/${product.id}/delete">
        ${csrfInput(csrf.token)}
          <button class="danger" type="submit">Kustuta</button>
        </form>
      </div>
    </li>`).join("");
    const messages = db.contacts.map((message) => `<li class="message-row">
      <p class="message-title">${escapeHtml(message.name)}</p>
      <p class="message-meta">${escapeHtml(message.email)} | ${escapeHtml(message.phone || "Telefon puudub")} | ${escapeHtml(new Date(message.createdAt).toLocaleString("et-EE"))}</p>
      <p>${escapeHtml(message.message)}</p>
    </li>`).join("");
    sendHtml(res, pageLayout("Admin", `<section class="hero-card">
        <div>
          <h1>Admin</h1>
          <p>Halda Grind poe tooteid, hindu ja kontaktivormi sõnumeid ühest puhtast vaates.</p>
        </div>
        <div class="actions">
          <a class="button" href="/admin/products/new">Lisa uus toode</a>
          <form method="post" action="/admin/logout">${csrfInput(csrf.token)}<button type="submit">Logi välja</button></form>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>Tooted</h2>
          <span class="meta">${db.products.length} toodet</span>
        </div>
        <ul class="product-list">${rows || `<li class="empty">Tooteid pole.</li>`}</ul>
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>Kontaktivormi sõnumid</h2>
          <span class="meta">${db.contacts.length} sõnumit</span>
        </div>
        <ul class="message-list">${messages || `<li class="empty">Sõnumeid pole.</li>`}</ul>
      </section>`), 200, csrf.headers);
    return;
  }

  if (url.pathname === "/admin/products/new" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    const csrf = csrfHeaders(req);
    sendHtml(res, pageLayout("Lisa toode", `<section class="hero-card"><div><h1>Lisa toode</h1><p>Lisa uus toode koos hinna, pildi, suuruste ja koodidega.</p></div></section>${productForm({}, csrf.token)}`), 200, csrf.headers);
    return;
  }

  if (url.pathname === "/admin/products/new" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    const error = validateProductForm(form);
    if (error) return sendHtml(res, pageLayout("Viga", `<section class="panel"><h2>Viga</h2><p class="empty">${escapeHtml(error)}</p><div class="actions" style="margin-top: 18px;"><a class="button" href="/admin/products/new">Tagasi</a></div></section>`), 400);
    db.products.push(productFromForm(form));
    await writeDb(db);
    redirect(res, "/admin");
    return;
  }

  const editMatch = url.pathname.match(/^\/admin\/products\/([^/]+)\/edit$/);
  if (editMatch && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    const csrf = csrfHeaders(req);
    const product = db.products.find((item) => item.id === editMatch[1]);
    if (!product) return sendHtml(res, "Toodet ei leitud", 404);
    sendHtml(res, pageLayout("Muuda toodet", `<section class="hero-card"><div><h1>Muuda toodet</h1><p>Uuenda toote infot ja salvesta muudatused admin vaatesse.</p></div></section>${productForm(product, csrf.token)}`), 200, csrf.headers);
    return;
  }

  if (editMatch && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    const error = validateProductForm(form);
    if (error) return sendHtml(res, pageLayout("Viga", `<section class="panel"><h2>Viga</h2><p class="empty">${escapeHtml(error)}</p><div class="actions" style="margin-top: 18px;"><a class="button" href="/admin/products/${editMatch[1]}/edit">Tagasi</a></div></section>`), 400);
    const index = db.products.findIndex((item) => item.id === editMatch[1]);
    if (index === -1) return sendHtml(res, "Toodet ei leitud", 404);
    db.products[index] = productFromForm(form, editMatch[1]);
    await writeDb(db);
    redirect(res, "/admin");
    return;
  }

  const deleteMatch = url.pathname.match(/^\/admin\/products\/([^/]+)\/delete$/);
  if (deleteMatch && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    db.products = db.products.filter((item) => item.id !== deleteMatch[1]);
    await writeDb(db);
    redirect(res, "/admin");
    return;
  }

  const contactDeleteMatch = url.pathname.match(/^\/admin\/contacts\/([^/]+)\/delete$/);
  if (contactDeleteMatch && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    db.contacts = db.contacts.filter((message) => message.id !== contactDeleteMatch[1]);
    await writeDb(db);
    redirect(res, "/admin");
    return;
  }

  sendHtml(res, "Admin lehte ei leitud", 404);
}

async function handleBackendViews(req, res, url) {
  const db = await readDb();

  if (url.pathname === "/backend/tooted") {
    const products = db.products.map((product) => `<a href="/backend/tooted/${product.id}" class="product-card">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <p class="product-title">${escapeHtml(product.name)}</p>
      <p class="meta">${escapeHtml(product.category)} | ${escapeHtml(product.productCode)}</p>
      <p>${escapeHtml(product.description)}</p>
      <strong>${product.price.toFixed(2)}€</strong>
    </a>`).join("");
    sendHtml(res, pageLayout("Backend tooted", `<section class="hero-card">
        <div>
          <h1>Tooted</h1>
          <p>Backend-renderdatud tootevaade JSON-andmebaasist.</p>
        </div>
      </section>
      <section class="product-grid">${products}</section>`));
    return;
  }

  const detailMatch = url.pathname.match(/^\/backend\/tooted\/([^/]+)$/);
  if (detailMatch) {
    const product = db.products.find((item) => item.id === detailMatch[1]);
    if (!product) return sendHtml(res, "Toodet ei leitud", 404);
    sendHtml(res, pageLayout(product.name, `<section class="panel">
      <div class="detail-layout">
        <img class="product-detail-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        <div>
          <h2>${escapeHtml(product.name)}</h2>
          <p>${escapeHtml(product.description)}</p>
          <p class="product-title">${product.price.toFixed(2)}€</p>
          <p class="meta">Kategooria: ${escapeHtml(product.category)}</p>
          <p class="meta">Suurused: ${escapeHtml(product.sizes.join(", "))}</p>
          <p class="meta">Bränd: ${escapeHtml(product.brand)}</p>
          <p class="meta">Tootekood: ${escapeHtml(product.productCode)}</p>
          <p class="meta">Stiilikood: ${escapeHtml(product.styleCode)}</p>
          <div class="actions" style="margin-top: 22px;"><a class="button secondary" href="/backend/tooted">Tagasi toodetesse</a></div>
        </div>
      </div>
    </section>`));
    return;
  }

  sendHtml(res, "Backend vaadet ei leitud", 404);
}

async function handleContact(req, res) {
  const form = await readForm(req);
  if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
  const error = validateContactForm(form);
  if (error) return sendHtml(res, pageLayout("Viga", `<section class="panel"><h2>Viga</h2><p class="empty">${escapeHtml(error)}</p><div class="actions" style="margin-top: 18px;"><a class="button" href="/kontaktivorm.html">Tagasi</a></div></section>`), 400);
  const db = await readDb();
  db.contacts.push({
    id: crypto.randomUUID(),
    name: form.name.trim(),
    email: form.email.trim(),
    phone: String(form.phone || "").trim(),
    message: form.message.trim(),
    createdAt: new Date().toISOString()
  });
  await writeDb(db);
  sendHtml(res, pageLayout("Sõnum saadetud", `<section class="hero-card"><div><h1>Aitäh!</h1><p>Sinu sõnum on salvestatud ja nähtav admin lehel.</p></div><a class="button" href="/kontaktivorm.html">Tagasi</a></section>`));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/products") {
      sendJson(res, (await readDb()).products);
      return;
    }

    if (url.pathname === "/contact" && req.method === "POST") {
      await handleContact(req, res);
      return;
    }

    if (url.pathname.startsWith("/admin")) {
      await handleAdmin(req, res, url);
      return;
    }

    if (url.pathname.startsWith("/backend")) {
      await handleBackendViews(req, res, url);
      return;
    }

    await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    sendHtml(res, "Serveri viga", 500);
  }
});

ensureDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Grind backend töötab: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
  });
});
