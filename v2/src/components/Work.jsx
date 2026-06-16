import { Link } from 'react-router-dom';
import { BRANDS, KEY_PROJECTS, SIDE_PROJECTS } from '../data';
import { Briefcase, Folder, Building, ChevronRight, ExternalLink } from 'pixelarticons/react';

export default function Work() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <Briefcase className="text-accent" width={20} height={20} />
        <h1 className="text-2xl font-bold">Work</h1>
      </div>

      {/* Brands */}
      <section className="mb-14">
        <h2 className="section-label mb-4">
          <Building className="text-accent" width={12} height={12} />
          Clients &amp; Experience
        </h2>
        <div className="flex flex-wrap gap-3">
          {BRANDS.map((b) => (
            <a
              key={b.name}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-chip"
              title={b.name}
            >
              <img src={b.logo} alt="" className="w-4 h-4 rounded-sm" loading="lazy" />
              <span>{b.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-14">
        <h2 className="section-label mb-6">
          <Folder className="text-accent" width={12} height={12} />
          Projects
        </h2>
        <div className="space-y-10">
          {KEY_PROJECTS.map((group) => (
            <div key={group.company}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{group.company}</h3>
              <div className="space-y-3">
                {group.projects.map((p) => {
                  const inner = (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          {p.impact && (
                            <span className="impact-badge">{p.impact}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2 leading-relaxed">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.tech.map((t) => (
                            <span key={t} className="tech-pill">{t}</span>
                          ))}
                        </div>
                      </div>
                      {p.slug && (
                        <ChevronRight className="text-gray-300 group-hover:text-accent shrink-0 transition-colors mt-1" width={16} height={16} />
                      )}
                    </>
                  );

                  return p.slug ? (
                    <Link
                      key={p.name}
                      to={`/work/${p.slug}`}
                      className="project-card group"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={p.name} className="project-card">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Side Projects */}
      <section>
        <h2 className="section-label mb-5">
          <Folder className="text-accent" width={12} height={12} />
          Side Projects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SIDE_PROJECTS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="side-project-card group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                <ExternalLink className="text-gray-300 group-hover:text-accent shrink-0 transition-colors" width={12} height={12} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{p.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
