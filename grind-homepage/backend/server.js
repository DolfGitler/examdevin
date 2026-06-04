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
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <nav>
    <a href="/">Pood</a> |
    <a href="/backend/tooted">Backend tooted</a> |
    <a href="/admin">Admin</a>
  </nav>
  <hr>
  ${content}
</body>
</html>`;
}

function productForm(product = {}, csrfToken = "") {
  return `<form method="post">
    ${csrfInput(csrfToken)}
    <p><label>Nimi<br><input name="name" value="${escapeHtml(product.name)}" required></label></p>
    <p><label>Kirjeldus<br><textarea name="description" rows="5" required>${escapeHtml(product.description)}</textarea></label></p>
    <p><label>Pildi tee<br><input name="image" value="${escapeHtml(product.image || "../assets/transparent-bg/tossud1.png")}" required></label></p>
    <p><label>Hind<br><input name="price" type="number" step="0.01" value="${escapeHtml(product.price || "")}" required></label></p>
    <p><label>Kategooria<br><input name="category" value="${escapeHtml(product.category || "riietus")}" required></label></p>
    <p><label>Suurused (komaga eraldatud)<br><input name="sizes" value="${escapeHtml((product.sizes || []).join(", "))}" required></label></p>
    <p><label>Bränd<br><input name="brand" value="${escapeHtml(product.brand || "")}" required></label></p>
    <p><label>Tootekood<br><input name="productCode" value="${escapeHtml(product.productCode || "")}" required></label></p>
    <p><label>Stiilikood<br><input name="styleCode" value="${escapeHtml(product.styleCode || "")}" required></label></p>
    <button type="submit">Salvesta</button>
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
    sendHtml(res, pageLayout("Admin login", `<h1>Admin sisselogimine</h1>
      <form method="post">
        ${csrfInput(csrf.token)}
        <p><label>Kasutajanimi<br><input name="username" required></label></p>
        <p><label>Parool<br><input name="password" type="password" required></label></p>
        <button type="submit">Logi sisse</button>
      </form>`), 200, csrf.headers);
    return;
  }

  if (url.pathname === "/admin/login" && req.method === "POST") {
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    const admin = db.admins.find((user) => user.username === form.username && verifyPassword(form.password || "", user.passwordHash));

    if (!admin) {
      sendHtml(res, pageLayout("Admin login", "<p>Vale kasutajanimi või parool.</p><p><a href=\"/admin/login\">Proovi uuesti</a></p>"), 401);
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
    const rows = db.products.map((product) => `<li>
      ${escapeHtml(product.name)} - ${product.price}€
      <a href="/admin/products/${product.id}/edit">Muuda</a>
      <form method="post" action="/admin/products/${product.id}/delete" style="display:inline">
        ${csrfInput(csrf.token)}
        <button type="submit">Kustuta</button>
      </form>
    </li>`).join("");
    const messages = db.contacts.map((message) => `<li>
      <strong>${escapeHtml(message.name)}</strong> (${escapeHtml(message.email)}, ${escapeHtml(message.phone)})<br>
      ${escapeHtml(message.message)}
    </li>`).join("");
    sendHtml(res, pageLayout("Admin", `<h1>Admin</h1>
      <p><a href="/admin/products/new">Lisa uus toode</a></p>
      <form method="post" action="/admin/logout">${csrfInput(csrf.token)}<button type="submit">Logi välja</button></form>
      <h2>Tooted</h2><ul>${rows}</ul>
      <h2>Kontaktivormi sõnumid</h2><ul>${messages || "<li>Sõnumeid pole.</li>"}</ul>`), 200, csrf.headers);
    return;
  }

  if (url.pathname === "/admin/products/new" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    const csrf = csrfHeaders(req);
    sendHtml(res, pageLayout("Lisa toode", `<h1>Lisa toode</h1>${productForm({}, csrf.token)}`), 200, csrf.headers);
    return;
  }

  if (url.pathname === "/admin/products/new" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    const error = validateProductForm(form);
    if (error) return sendHtml(res, pageLayout("Viga", `<p>${escapeHtml(error)}</p><p><a href="/admin/products/new">Tagasi</a></p>`), 400);
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
    sendHtml(res, pageLayout("Muuda toodet", `<h1>Muuda toodet</h1>${productForm(product, csrf.token)}`), 200, csrf.headers);
    return;
  }

  if (editMatch && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const form = await readForm(req);
    if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
    const error = validateProductForm(form);
    if (error) return sendHtml(res, pageLayout("Viga", `<p>${escapeHtml(error)}</p><p><a href="/admin/products/${editMatch[1]}/edit">Tagasi</a></p>`), 400);
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

  sendHtml(res, "Admin lehte ei leitud", 404);
}

async function handleBackendViews(req, res, url) {
  const db = await readDb();

  if (url.pathname === "/backend/tooted") {
    const products = db.products.map((product) => `<article>
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="180">
      <h2><a href="/backend/tooted/${product.id}">${escapeHtml(product.name)}</a></h2>
      <p>${escapeHtml(product.description)}</p>
      <strong>${product.price}€</strong>
    </article>`).join("<hr>");
    sendHtml(res, pageLayout("Backend tooted", `<h1>Tooted</h1>${products}`));
    return;
  }

  const detailMatch = url.pathname.match(/^\/backend\/tooted\/([^/]+)$/);
  if (detailMatch) {
    const product = db.products.find((item) => item.id === detailMatch[1]);
    if (!product) return sendHtml(res, "Toodet ei leitud", 404);
    sendHtml(res, pageLayout(product.name, `<h1>${escapeHtml(product.name)}</h1>
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="360">
      <p>${escapeHtml(product.description)}</p>
      <p>Hind: <strong>${product.price}€</strong></p>
      <p>Kategooria: ${escapeHtml(product.category)}</p>
      <p>Suurused: ${escapeHtml(product.sizes.join(", "))}</p>
      <p>Bränd: ${escapeHtml(product.brand)}</p>
      <p>Tootekood: ${escapeHtml(product.productCode)}</p>
      <p>Stiilikood: ${escapeHtml(product.styleCode)}</p>`));
    return;
  }

  sendHtml(res, "Backend vaadet ei leitud", 404);
}

async function handleContact(req, res) {
  const form = await readForm(req);
  if (!verifyCsrf(req, form)) return sendHtml(res, "CSRF kontroll ebaõnnestus.", 403);
  const error = validateContactForm(form);
  if (error) return sendHtml(res, pageLayout("Viga", `<p>${escapeHtml(error)}</p><p><a href="/kontaktivorm.html">Tagasi</a></p>`), 400);
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
  sendHtml(res, pageLayout("Sõnum saadetud", `<h1>Aitäh!</h1><p>Sinu sõnum on salvestatud.</p><p><a href="/kontaktivorm.html">Tagasi</a></p>`));
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
