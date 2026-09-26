import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject, linkAttrs, realLink } from "../api.js";

function Paragraphs({ text }) {
  if (!text) return null;
  return text.split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>);
}

export default function Work() {
  const { slug } = useParams();
  const [project, setProject] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    setProject(undefined);
    setError(null);
    getProject(slug)
      .then(setProject)
      .catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (error) {
    return (
      <main className="section">
        <p className="status error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (project === undefined) {
    return (
      <main className="loading-screen">
        <div className="loader-pulse" />
        <p>Loading project…</p>
      </main>
    );
  }

  if (project === null) {
    return (
      <main className="section">
        <p className="status">No project with that name.</p>
        <p>
          <Link to="/#work">Back to work</Link>
        </p>
      </main>
    );
  }

  const live = realLink(project.links?.live);
  const play = realLink(project.links?.play);
  const repo = realLink(project.links?.repo);
  const description = project.description || project.body || "";
  const technical = project.technical || "";

  return (
    <main className="section project-page">
      <p className="crumb">
        <Link to="/#work">Work</Link>
        <span aria-hidden="true"> / </span>
        <span>{project.title}</span>
      </p>

      {project.image && (
        <div className="project-hero-image">
          <img src={project.image} alt={project.title} />
        </div>
      )}

      <header className="project-hero">
        <p className="section-kicker">
          {project.category} · {project.year}
          {project.company ? ` · ${project.company}` : ""}
        </p>
        <h1>{project.title}</h1>
        <p className="hero-lead">{project.summary}</p>
        {(live || play || repo) && (
          <div className="hero-actions">
            {live && (
              <a className="btn btn-primary" href={live} {...linkAttrs(live)}>
                Live site
              </a>
            )}
            {play && (
              <a
                className={live ? "btn btn-ghost" : "btn btn-primary"}
                href={play}
                {...linkAttrs(play)}
              >
                Google Play
              </a>
            )}
            {repo && (
              <a className="btn btn-ghost" href={repo} {...linkAttrs(repo)}>
                Repository
              </a>
            )}
          </div>
        )}
      </header>

      <div className="project-sections">
        <section className="project-block" aria-labelledby="project-about">
          <p className="section-kicker" id="project-about">
            About the project
          </p>
          <h2>Description</h2>
          <div className="project-body">
            <Paragraphs text={description} />
          </div>
        </section>

        {(technical || project.stack?.length > 0) && (
          <section className="project-block" aria-labelledby="project-tech">
            <p className="section-kicker" id="project-tech">
              Under the hood
            </p>
            <h2>Technical details</h2>
            {technical && (
              <div className="project-body">
                <Paragraphs text={technical} />
              </div>
            )}
            {project.stack?.length > 0 && (
              <div className="chip-row project-stack">
                {project.stack.map((s) => (
                  <span key={s} className="chip gold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
