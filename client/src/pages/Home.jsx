import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getProjects, linkAttrs, realLink, sendContact } from "../api.js";
import { useCountUp, useInView, useLightRail } from "../hooks.js";

function LightRail({ className = "", children }) {
  const [ref, progress] = useLightRail();
  return (
    <div
      ref={ref}
      className={`light-rail ${className}`.trim()}
      style={{ "--rail-progress": progress }}
    >
      <div className="light-rail-track" aria-hidden="true">
        <div className="light-rail-fill" />
      </div>
      {children}
    </div>
  );
}

function TechIcon({ slug, name }) {
  const [failed, setFailed] = useState(false);
  // Express (and a few others) ship black marks — force light on dark tiles.
  const darkMarks = new Set(["express"]);
  const color = darkMarks.has(slug) ? "ffffff" : "";
  const initials = name
    .split(/[\s/]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  if (failed || !slug) {
    return <span className="tech-fallback">{initials}</span>;
  }
  return (
    <img
      className="tech-icon"
      src={`https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ""}`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`reveal${inView ? " is-in" : ""} ${className}`.trim()}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function Stat({ value, suffix, label, active, style }) {
  const n = useCountUp(value, active);
  return (
    <div className="stat" style={style}>
      <div className="stat-value">
        {n}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function TypeLine({ phrases }) {
  const list = useMemo(
    () => (phrases?.length ? phrases : ["Software Engineer"]),
    [phrases]
  );
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = list[index % list.length];
    const speed = deleting ? 40 : 70;
    const pause =
      full === text && !deleting ? 1400 : deleting && text === "" ? 400 : speed;

    const t = setTimeout(() => {
      if (!deleting && text === full) {
        setDeleting(true);
        return;
      }
      if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => (i + 1) % list.length);
        return;
      }
      setText(full.slice(0, text.length + (deleting ? -1 : 1)));
    }, pause);

    return () => clearTimeout(t);
  }, [text, deleting, index, list]);

  return (
    <p className="hero-typed">
      Professional <span className="accent-text">{text}</span>
      <span className="caret" aria-hidden="true">
        |
      </span>
    </p>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      await sendContact({ name, email, message });
      setStatus({ ok: true, text: "Message sent — thanks." });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <label>
        <span>Your name</span>
        <input
          name="name"
          placeholder="John Doe"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Your email</span>
        <input
          name="email"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Message</span>
        <textarea
          name="message"
          rows={5}
          placeholder="Tell me about the project or backend you need…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "Sending…" : "Send Message"}
      </button>
      {status && (
        <p className={status.ok ? "status ok" : "status error"} role={status.ok ? "status" : "alert"}>
          {status.text}
        </p>
      )}
    </form>
  );
}

export default function Home({ profile }) {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [pillar, setPillar] = useState(0);
  const [statsRef, statsInView] = useInView();
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!location.hash || !profile) return;
    const id = location.hash.slice(1);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const jump = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    const t = window.setTimeout(jump, 80);
    return () => window.clearTimeout(t);
  }, [location.hash, profile, location.pathname]);

  const email = realLink(profile?.links?.email);
  const github = realLink(profile?.links?.github);
  const linkedin = realLink(profile?.links?.linkedin);

  if (!profile) {
    return (
      <main className="loading-screen">
        <div className="loader-pulse" />
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <section className="hero" id="top">
        <div className="hero-copy">
          <Reveal>
            <div className="eyebrow">
              <span className="pulse-dot" aria-hidden="true" />
              <span className="eyebrow-text">{profile.availability}</span>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h1>
              Hi, I&apos;m
              <br />
              <span className="accent-text">{profile.name}</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <TypeLine phrases={profile.typedRoles} />
            <p className="hero-lead">{profile.intro}</p>
            {profile.aiNote ? <p className="hero-note">{profile.aiNote}</p> : null}
          </Reveal>
          <Reveal delay={160} className="hero-stack">
            {["PHP", "Laravel", "Node.js", "Express", "Redis", "PostgreSQL", "Docker"].map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </Reveal>
          <Reveal delay={200} className="hero-actions">
            <a className="btn btn-primary" href="#contact">
              Let&apos;s Talk →
            </a>
            <a className="btn btn-ghost" href={profile.cv || "/cv.pdf"} download="Ahmed-Ismail-CV.pdf">
              Download CV
            </a>
          </Reveal>
        </div>

        <Reveal delay={100} className="hero-visual">
          <div className="photo-wrap">
            <span className="photo-aura" aria-hidden="true" />
            <span className="float-icon fi-1" aria-hidden="true">
              {"</>"}
            </span>
            <span className="float-icon fi-2" aria-hidden="true">
              DB
            </span>
            <span className="float-icon fi-3" aria-hidden="true">
              API
            </span>
            <div className="photo-frame">
              {photoOk && (
                <img
                  className="photo"
                  src={profile.photo || "/images/profile.jpg"}
                  alt={profile.fullName || profile.name}
                  onError={() => setPhotoOk(false)}
                />
              )}
              {!photoOk && (
                <div className="photo-placeholder is-visible">
                  <span>Add your photo</span>
                  <code>client/public/images/profile.jpg</code>
                </div>
              )}
            </div>
          </div>
          <div className={`hero-stats${statsInView ? " is-live" : ""}`} ref={statsRef}>
            {profile.stats.map((s, i) => (
              <Stat
                key={s.label}
                value={s.value}
                suffix={s.suffix}
                label={s.label}
                active={statsInView}
                style={{ "--stat-i": i }}
              />
            ))}
          </div>
        </Reveal>
      </section>

      <p className="discover">
        Discover
        <span aria-hidden="true">↓</span>
      </p>

      <section className="section" id="about">
        <div className="about-split">
          <Reveal>
            <p className="section-kicker">About Me</p>
            <h2>
              Crafting <span className="accent-text">Reliable</span> Backends
            </h2>
            <p className="hero-lead">{profile.about}</p>
            <a className="text-link" href="#contact">
              Let&apos;s work together ↗
            </a>
          </Reveal>
          <div className="pillars">
            {profile.aboutPillars?.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <button
                  type="button"
                  className={`pillar${pillar === i ? " is-open" : ""}`}
                  onClick={() => setPillar(i)}
                >
                  <div className="pillar-head">
                    <span className="pillar-num">0{i + 1}</span>
                    <strong>{item.title}</strong>
                  </div>
                  {pillar === i && (
                    <div className="pillar-body">
                      <p>{item.body}</p>
                      <div className="chip-row">
                        {item.tags.map((t) => (
                          <span key={t} className="chip gold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="credentials">
        <Reveal className="section-head">
          <p className="section-kicker">Credentials</p>
          <h2>
            Licenses & <span className="accent-text">Certifications</span>
          </h2>
        </Reveal>
        <LightRail className="timeline">
          {profile.credentials?.map((c, i) => (
            <Reveal key={c.title} delay={i * 70} className={`timeline-row ${i % 2 ? "right" : "left"}`}>
              <article className="timeline-card">
                <span className="date-pill">{c.org}</span>
                <h3>{c.title}</h3>
                {c.years && <p className="muted">{c.years}</p>}
                <p>{c.body}</p>
                <div className="chip-row">
                  {c.tags.map((t) => (
                    <span key={t} className="chip gold">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </LightRail>
      </section>

      <section className="section" id="skills">
        <Reveal className="section-head">
          <p className="section-kicker">Technical Arsenal</p>
          <h2>
            Tech <span className="accent-text">Stack</span> & Skills
          </h2>
        </Reveal>
        <Reveal delay={60} className="tech-panel">
          <div className="tech-panel-head">
            <h3>Tech Stack</h3>
            <span className="tech-panel-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3 4 7.5 12 12l8-4.5L12 3Z" />
                <path d="M4 12 12 16.5 20 12" />
                <path d="M4 16.5 12 21l8-4.5" />
              </svg>
            </span>
          </div>
          <ul className="tech-grid">
            {(profile.techStack || []).map((item) => (
              <li key={item.name} className="tech-tile">
                <TechIcon slug={item.icon} name={item.name} />
                <span className="tech-name">{item.name}</span>
              </li>
            ))}
            <li className="tech-tile tech-tile-more" aria-hidden="true">
              <span className="tech-more-mark">+</span>
              <span className="tech-name">and more</span>
            </li>
          </ul>
        </Reveal>
      </section>

      <section className="section" id="services">
        <Reveal className="section-head">
          <p className="section-kicker">What I Offer</p>
          <h2>
            Premium <span className="accent-text">Services</span>
          </h2>
        </Reveal>
        <div className="services-grid">
          {profile.services.map((svc, i) => (
            <Reveal key={svc.title} delay={i * 80} className="service-card">
              <span className="service-icon" aria-hidden="true">
                {i === 0 ? "⬡" : i === 1 ? "⚡" : i === 2 ? "▣" : "⇄"}
              </span>
              <h3>{svc.title}</h3>
              <p>{svc.body}</p>
              <ul>
                {svc.points.map((p) => (
                  <li key={p}>
                    <span className="check" aria-hidden="true">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <a className="text-link" href="#contact">
                Start Project →
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="work">
        <Reveal className="section-head">
          <p className="section-kicker">Portfolio</p>
          <h2>
            Selected <span className="accent-text">Works</span>
          </h2>
        </Reveal>
        <div className="project-grid">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 40} className="project-card">
              <Link to={`/work/${project.slug}`}>
                <div className="project-thumb">
                  {project.image ? (
                    <img src={project.image} alt="" loading="lazy" />
                  ) : (
                    <span aria-hidden="true">{project.title.slice(0, 1)}</span>
                  )}
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="chip-row">
                  {project.stack.slice(0, 4).map((s) => (
                    <span key={s} className="chip gold">
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="experience">
        <Reveal className="section-head">
          <p className="section-kicker">Career Path</p>
          <h2>
            Professional <span className="accent-text">Journey</span>
          </h2>
        </Reveal>
        <LightRail className="journey">
          {profile.experience.map((job, i) => (
            <Reveal key={`${job.org}-${job.years}`} delay={i * 60} className={`journey-item ${i % 2 ? "right" : "left"}`}>
              <article className="journey-card">
                <span className="date-pill">{job.years}</span>
                <span className="journey-kind" aria-hidden="true">
                  {job.kind === "education" ? "🎓" : "</>"}
                </span>
                <h3>{job.title}</h3>
                <p className="journey-org">{job.org}</p>
                {job.meta && <p className="journey-meta">{job.meta}</p>}
                {job.bullets?.length ? (
                  <ul className="journey-bullets">
                    {job.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{job.note}</p>
                )}
                {job.tags && (
                  <div className="chip-row">
                    {job.tags.map((t) => (
                      <span key={t} className="chip gold">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </LightRail>
      </section>

      <section className="section contact-section" id="contact">
        <Reveal className="section-head center">
          <p className="section-kicker">Get in Touch</p>
          <h2>
            Let&apos;s Build Something <span className="accent-text">Amazing</span>
          </h2>
          <p className="hero-lead center-lead">
            Available for software engineering roles with a backend focus, and contract work. If you need solid APIs and server-side systems — or just want to say hi — inbox is open.
          </p>
        </Reveal>
        <div className="contact-grid">
          <Reveal delay={60} className="contact-aside">
            {email && (
              <a className="contact-line" href={`mailto:${email}`}>
                <span className="contact-ico" aria-hidden="true">
                  ✉
                </span>
                <span>
                  <small>Email Me</small>
                  <strong>{email}</strong>
                </span>
              </a>
            )}
            {profile.phone && (
              <a className="contact-line" href={`tel:${profile.phone.replace(/\s/g, "")}`}>
                <span className="contact-ico" aria-hidden="true">
                  ☎
                </span>
                <span>
                  <small>Call Me</small>
                  <strong>{profile.phone}</strong>
                </span>
              </a>
            )}
            <div className="contact-line">
              <span className="contact-ico" aria-hidden="true">
                ⌖
              </span>
              <span>
                <small>Location</small>
                <strong>{profile.location}</strong>
              </span>
            </div>
            <p className="social-label">Connect socially</p>
            <div className="social-row">
              {github && (
                <a className="social" href={github} {...linkAttrs(github)}>
                  GH
                </a>
              )}
              {linkedin && (
                <a className="social" href={linkedin} {...linkAttrs(linkedin)}>
                  in
                </a>
              )}
              {email && (
                <a className="social" href={`mailto:${email}`}>
                  @
                </a>
              )}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
