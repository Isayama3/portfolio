import profile from "@data/profile.json";
import projects from "@data/projects.json";

export async function getProfile() {
  return profile;
}

export async function getProjects() {
  return projects;
}

export async function getProject(slug) {
  return projects.find((p) => p.slug === slug) || null;
}

export async function sendContact({ name, email, message }) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    throw new Error(
      "Contact form is not configured. Add VITE_WEB3FORMS_ACCESS_KEY (free at web3forms.com)."
    );
  }

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `Portfolio contact from ${name}`,
      from_name: name,
      name,
      email,
      message,
      replyto: email,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Failed to send message");
  }
  return data;
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
