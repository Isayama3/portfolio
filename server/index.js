import "./env.js";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clientIp, lookupLocation, sendMail, smtpConfigured } from "./mail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const messagesPath = path.join(dataDir, "messages.json");
const clientDist = path.join(root, "client", "dist");

const app = express();
const port = process.env.PORT || 3001;

// ponytail: in-memory visit cooldown — swap for Redis if you scale past one process
const visitCooldownMs = Number(process.env.VISIT_COOLDOWN_MS || 6 * 60 * 60 * 1000);
const lastVisitMail = new Map();

app.use(express.json({ limit: "32kb" }));

async function readJson(file) {
  const raw = await fs.readFile(path.join(dataDir, file), "utf8");
  return JSON.parse(raw);
}

async function readMessages() {
  try {
    const raw = await fs.readFile(messagesPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

app.get("/api/profile", async (_req, res, next) => {
  try {
    res.json(await readJson("profile.json"));
  } catch (err) {
    next(err);
  }
});

app.get("/api/projects", async (_req, res, next) => {
  try {
    res.json(await readJson("projects.json"));
  } catch (err) {
    next(err);
  }
});

app.get("/api/projects/:slug", async (req, res, next) => {
  try {
    const projects = await readJson("projects.json");
    const project = projects.find((p) => p.slug === req.params.slug);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

app.post("/api/visit", async (req, res, next) => {
  try {
    const ip = clientIp(req);
    const now = Date.now();
    const prev = lastVisitMail.get(ip) || 0;
    if (now - prev < visitCooldownMs) {
      res.json({ ok: true, mailed: false, reason: "cooldown" });
      return;
    }
    lastVisitMail.set(ip, now);

    const pathHint =
      typeof req.body?.path === "string" ? req.body.path.slice(0, 200) : "/";
    const ua =
      typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"].slice(0, 240)
        : "";
    const geo = await lookupLocation(ip);

    const mail = await sendMail({
      subject: `Portfolio visit — ${geo.summary}`,
      text: [
        "Someone opened your portfolio.",
        "",
        `When: ${new Date().toISOString()}`,
        `Path: ${pathHint}`,
        `Location: ${geo.summary}`,
        `IP: ${ip || "unknown"}`,
        ua ? `User-Agent: ${ua}` : "",
        "",
        "Geo detail:",
        JSON.stringify(geo.detail, null, 2),
      ]
        .filter(Boolean)
        .join("\n"),
    });

    res.json({ ok: true, mailed: mail.sent, reason: mail.reason });
  } catch (err) {
    next(err);
  }
});

app.post("/api/contact", async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "A valid email is required." });
      return;
    }

    const ip = clientIp(req);
    const geo = await lookupLocation(ip);

    const messages = await readMessages();
    messages.push({
      name,
      email,
      message,
      ip: ip || null,
      location: geo.summary,
      at: new Date().toISOString(),
    });
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2) + "\n");

    const mail = await sendMail({
      subject: `Portfolio contact from ${name}`,
      replyTo: email,
      text: [
        "New contact form message.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `When: ${new Date().toISOString()}`,
        `Visitor location: ${geo.summary}`,
        `IP: ${ip || "unknown"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    if (!mail.sent && mail.reason === "smtp_missing") {
      res.status(201).json({
        ok: true,
        mailed: false,
        warning: "Saved locally; email not sent (SMTP not configured).",
      });
      return;
    }

    res.status(201).json({ ok: true, mailed: mail.sent });
  } catch (err) {
    next(err);
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(port, () => {
  console.log(`server on http://localhost:${port}`);
  if (!smtpConfigured()) {
    console.warn(
      "[mail] Set SMTP_USER + SMTP_PASS (Gmail App Password) to enable visit/contact emails."
    );
  }
});
