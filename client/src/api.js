export async function getProfile() {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function getProjects() {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function getProject(slug) {
  const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load project");
  return res.json();
}

export async function sendContact({ name, email, message }) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data;
}

export async function pingVisit(pathHint) {
  try {
    await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathHint || "/" }),
      keepalive: true,
    });
  } catch {
    // visit ping is best-effort
  }
}

export function realLink(value) {
  if (!value || typeof value !== "string") return null;
  const v = value.trim();
  if (!v || (v.startsWith("[") && v.endsWith("]"))) return null;
  return v;
}

/** Open http(s) links in a new tab; leave mailto/tel/relative alone. */
export function linkAttrs(href) {
  if (!href || typeof href !== "string") return {};
  if (/^https?:\/\//i.test(href)) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}
