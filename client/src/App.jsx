import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getProfile, linkAttrs, realLink } from "./api.js";
import Home from "./pages/Home.jsx";
import Work from "./pages/Work.jsx";

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

function SiteHeader({ brand, locationLabel, links }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  const location = useLocation();
  const onHome = location.pathname === "/";
  const clock = useCairoClock();
  const github = realLink(links?.github);
  const linkedin = realLink(links?.linkedin);
  const brandLeft = (brand || "Ahmed.Dev").split(".")[0];

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
            <span className="brand-first">{brandLeft}</span>
            <span className="brand-script">.Dev</span>
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
            <span className="header-place">{locationLabel || "Giza, Egypt"}</span>
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
        <div className="nav-overlay-glow" aria-hidden="true" />
        <nav className="nav-overlay-links" aria-label="Mobile">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="nav-link"
              style={{ "--i": i }}
              onClick={() => navTo(s.id)}
            >
              <span className="nav-index">0{i + 1}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="nav-overlay-social" style={{ "--i": SECTIONS.length }}>
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
          {(profile?.brand || "Ahmed.Dev").split(".")[0]}
          <span className="brand-dot">.Dev</span>
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
        locationLabel={profile?.location?.includes("Egypt") ? "Giza, Egypt" : profile?.location}
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
