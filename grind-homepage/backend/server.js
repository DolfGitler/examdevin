const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "websites.json");

async function readWebsites() {
  const data = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(data);
}

async function writeWebsites(websites) {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(websites, null, 2)}\n`);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function getIdFromUrl(url) {
  const match = url.match(/^\/api\/websites\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function isValidWebsite(data) {
  return (
    typeof data.title === "string" &&
    data.title.trim().length > 0 &&
    typeof data.url === "string" &&
    data.url.trim().length > 0
  );
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/api/websites") {
      const websites = await readWebsites();
      sendJson(res, 200, websites);
      return;
    }

    if (req.method === "POST" && req.url === "/api/websites") {
      const body = await readBody(req);

      if (!isValidWebsite(body)) {
        sendJson(res, 400, { error: "title and url are required" });
        return;
      }

      const websites = await readWebsites();
      const nextId = websites.length ? Math.max(...websites.map((site) => site.id)) + 1 : 1;
      const website = {
        id: nextId,
        title: body.title.trim(),
        url: body.url.trim(),
        description: typeof body.description === "string" ? body.description.trim() : ""
      };

      websites.push(website);
      await writeWebsites(websites);
      sendJson(res, 201, website);
      return;
    }

    const id = getIdFromUrl(req.url);

    if (req.method === "PUT" && id) {
      const body = await readBody(req);

      if (!isValidWebsite(body)) {
        sendJson(res, 400, { error: "title and url are required" });
        return;
      }

      const websites = await readWebsites();
      const index = websites.findIndex((site) => site.id === id);

      if (index === -1) {
        sendJson(res, 404, { error: "website not found" });
        return;
      }

      websites[index] = {
        id,
        title: body.title.trim(),
        url: body.url.trim(),
        description: typeof body.description === "string" ? body.description.trim() : ""
      };

      await writeWebsites(websites);
      sendJson(res, 200, websites[index]);
      return;
    }

    if (req.method === "DELETE" && id) {
      const websites = await readWebsites();
      const nextWebsites = websites.filter((site) => site.id !== id);

      if (nextWebsites.length === websites.length) {
        sendJson(res, 404, { error: "website not found" });
        return;
      }

      await writeWebsites(nextWebsites);
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 404, { error: "route not found" });
  } catch (error) {
    sendJson(res, 500, { error: "server error" });
  }
});

server.listen(PORT, () => {
  console.log(`JSON backend running at http://localhost:${PORT}`);
});
