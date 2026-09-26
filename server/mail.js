import "./env.js";
import nodemailer from "nodemailer";

function notifyTo() {
  return process.env.NOTIFY_EMAIL || "ahmed.ismail11199@gmail.com";
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter;

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({ subject, text, replyTo }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("[mail] SMTP not configured — skipped:", subject);
    return { sent: false, reason: "smtp_missing" };
  }
  await tx.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: notifyTo(),
    subject,
    text,
    replyTo,
  });
  return { sent: true };
}

export function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  return (req.socket?.remoteAddress || "").replace(/^::ffff:/, "");
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}

export async function lookupLocation(ip) {
  if (isPrivateIp(ip)) {
    return {
      summary: "Local / private network (no public geo)",
      detail: { ip: ip || "unknown", private: true },
    };
  }
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,zip,lat,lon,isp,query`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.status !== "success") {
      return { summary: `IP ${ip} (geo unavailable)`, detail: { ip, error: data.message } };
    }
    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return {
      summary: `${parts.join(", ")} · ISP ${data.isp || "n/a"} · IP ${data.query || ip}`,
      detail: data,
    };
  } catch (err) {
    return { summary: `IP ${ip} (geo lookup failed)`, detail: { ip, error: String(err.message || err) } };
  }
}

export { smtpConfigured };
