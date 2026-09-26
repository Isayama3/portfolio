import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getProfile, linkAttrs, realLink } from "./api.js";
import Home from "./pages/Home.jsx";
import Work from "./pages/Work.jsx";

function WhatsAppIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.99.58 3.84 1.6 5.42L2 22l4.9-1.7a9.86 9.86 0 0 0 5.14 1.42h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2Zm5.77 14.01c-.24.67-1.4 1.23-1.94 1.3-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.18-4.93-4.37-.14-.19-1.17-1.56-1.17-2.97 0-1.41.74-2.1 1-2.39.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.2-.15.32-.3.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.56.16.28.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.28.14.44.12.6-.07.17-.2.7-.81.89-1.09.19-.28.37-.23.63-.14.26.1 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.35Z" />
    </svg>
  );
}

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "credentials", label: "Certificates" },
  { id: "skills", label: "Skills" },
  { id: "services", label: "Services" },
  { id: "work", label: "Projects" },
  { id: "experience", label: "Timeline" },
  { id: "contact", label: "Contact" },
];

const PILL_LINKS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Projects" },
  { id: "experience", label: "Experience" },
];

function useCairoClock() {
  const [time, setTime] = useState(() => formatCairoTime());
  useEffect(() => {
    const tick = () => setTime(formatCairoTime());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

function formatCairoTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function SiteHeader({ brand, links }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  const location = useLocation();
  const onHome = location.pathname === "/";
  const clock = useCairoClock();
  const github = realLink(links?.github);
  const linkedin = realLink(links?.linkedin);
  const whatsapp = realLink(links?.whatsapp);
  const brandLabel = brand || "Ahmed Ismail";
  const [brandMain, ...brandRest] = brandLabel.trim().split(/\s+/);
  const brandAccent = brandRest.join(" ");

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", open);
    return () => document.body.classList.remove("nav-locked");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!onHome) {
      setActive("");
      return;
    }
    const ids = ["top", "about", "work", "experience", "contact"];
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!nodes.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.35, 0.6] }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [onHome, location.pathname]);

  function navTo(id) {
    setOpen(false);
    setActive(id);
    if (id === "top") {
      if (onHome) window.scrollTo({ top: 0, behavior: "smooth" });
      else window.location.href = "/#top";
      return;
    }
    if (onHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-first">{brandMain}</span>
            {brandAccent ? (
              <>
                {" "}
                <span className="brand-script">{brandAccent}</span>
              </>
            ) : null}
          </Link>

          <nav className="nav-pill" aria-label="Primary">
            {PILL_LINKS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`nav-pill-link${active === s.id ? " is-active" : ""}`}
                onClick={() => navTo(s.id)}
              >
                {s.label}
              </button>
            ))}
            <a className="nav-pill-link nav-pill-resume" href="/cv.pdf" download="Ahmed-Ismail-CV.pdf">
              Resume
              <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
                />
              </svg>
            </a>
            <span className="nav-pill-sep" aria-hidden="true" />
            <button type="button" className="nav-contact" onClick={() => navTo("contact")}>
              Contact
            </button>
          </nav>

          <div className="header-meta">
            <span className="header-time">{clock}</span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className={`icon-btn nav-toggle${open ? " is-open" : ""}`}
              aria-expanded={open}
              aria-controls="site-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="burger" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-nav"
        className={`nav-overlay${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Site menu"
      >
        <div className="nav-sheet">
          <div className="nav-sheet-top">
            <Link to="/" className="brand" onClick={() => setOpen(false)}>
              <span className="brand-first">{brandMain}</span>
              {brandAccent ? (
                <>
                  {" "}
                  <span className="brand-script">{brandAccent}</span>
                </>
              ) : null}
            </Link>
            <button
              type="button"
              className="icon-btn nav-sheet-close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <span className="nav-close-x" aria-hidden="true" />
            </button>
          </div>

          <nav className="nav-overlay-links" aria-label="Mobile">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`nav-link${active === s.id ? " is-active" : ""}`}
                style={{ "--i": i }}
                onClick={() => navTo(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="nav-sheet-foot" style={{ "--i": SECTIONS.length }}>
            <div className="nav-overlay-social">
              {github && (
                <a className="social" href={github} {...linkAttrs(github)} onClick={() => setOpen(false)}>
                  GH
                </a>
              )}
              {linkedin && (
                <a className="social" href={linkedin} {...linkAttrs(linkedin)} onClick={() => setOpen(false)}>
                  in
                </a>
              )}
              {whatsapp && (
                <a
                  className="social social-wa"
                  href={whatsapp}
                  {...linkAttrs(whatsapp)}
                  onClick={() => setOpen(false)}
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              )}
              <a
                className="social"
                href="/cv.pdf"
                download="Ahmed-Ismail-CV.pdf"
                onClick={() => setOpen(false)}
                title="Download CV"
              >
                CV
              </a>
            </div>
            <p className="nav-sheet-tag">Backend-focused software engineer</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SiteFooter({ profile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const email = realLink(profile?.links?.email);

  function goHash(id) {
    if (location.pathname === "/") {
      if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate({ pathname: "/", hash: `#${id}` });
  }

  return (
    <footer className="site-footer">
      <div>
        <strong className="brand-name">
          {(profile?.brand || "Ahmed Ismail").split(/\s+/)[0]}
          {((profile?.brand || "Ahmed Ismail").split(/\s+/).slice(1).join(" ") || "") && (
            <>
              {" "}
              <span className="brand-dot">
                {(profile?.brand || "Ahmed Ismail").split(/\s+/).slice(1).join(" ")}
              </span>
            </>
          )}
        </strong>
        <p>{profile?.tagline}</p>
      </div>
      <div className="footer-cta">
        <span>Have an idea?</span>
        <a
          href="/#contact"
          onClick={(e) => {
            e.preventDefault();
            goHash("contact");
          }}
        >
          Let&apos;s discuss it →
        </a>
      </div>
      <div className="footer-meta">
        {email && <a href={`mailto:${email}`}>{email}</a>}
        <span>
          © {new Date().getFullYear()} {profile?.fullName || "Ahmed Ismail"}
        </span>
      </div>
      <a
        className="back-top"
        href="/#top"
        aria-label="Back to top"
        onClick={(e) => {
          e.preventDefault();
          goHash("top");
        }}
      >
        ↑
      </a>
    </footer>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.removeItem("theme");
    document.documentElement.removeAttribute("data-theme");
  }, []);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="app-shell">
      <div className="bg-glow" aria-hidden="true" />
      <SiteHeader
        brand={profile?.brand}
        links={profile?.links}
      />
      {error ? (
        <p className="status error" role="alert">
          {error}
        </p>
      ) : (
        <Routes>
          <Route path="/" element={<Home profile={profile} />} />
          <Route path="/work/:slug" element={<Work />} />
          <Route path="/about" element={<Home profile={profile} />} />
          <Route path="/contact" element={<Home profile={profile} />} />
        </Routes>
      )}
      <SiteFooter profile={profile} />
    </div>
  );
}
