import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BRANDS, KEY_PROJECTS, SIDE_PROJECTS, SKILLS, STRENGTHS, TRANSVERSAL_SKILLS } from '../data';
import { Briefcase, Folder, Building, ExternalLink, Close } from 'pixelarticons/react';

const normTech = (t) => (t === 'React 19' ? 'React' : t);

const BRAND_TO_COMPANIES = new Map();
KEY_PROJECTS.forEach((g) => {
  (g.clients || []).forEach((client) => {
    if (!BRAND_TO_COMPANIES.has(client)) BRAND_TO_COMPANIES.set(client, new Set());
    BRAND_TO_COMPANIES.get(client).add(g.company);
  });
});

const COMPANY_LOGO = new Map();
KEY_PROJECTS.forEach((g) => {
  const primaryClient = (g.clients || [])[0];
  const brand = primaryClient && BRANDS.find((b) => b.name === primaryClient);
  if (brand) COMPANY_LOGO.set(g.company, brand.logo);
});

const CROSS_TECH = (() => {
  const techToCompanies = new Map();
  KEY_PROJECTS.forEach((g) => {
    g.projects.forEach((p) => {
      p.tech.forEach((t) => {
        const nt = normTech(t);
        if (!techToCompanies.has(nt)) techToCompanies.set(nt, new Set());
        techToCompanies.get(nt).add(g.company);
      });
    });
  });
  return [...techToCompanies.entries()]
    .filter(([, cs]) => cs.size > 1)
    .map(([t]) => t)
    .sort();
})();

function toggleSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function ProjectCard({ p, company, logo }) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 mb-1.5">
        {logo && (
          <img
            src={logo}
            alt={company}
            title={company}
            className="w-4 h-4 rounded-sm shrink-0 opacity-50"
            loading="lazy"
          />
        )}
        <span className="text-[0.65rem] uppercase tracking-wider text-gray-400 truncate">{company}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-semibold text-sm text-gray-900 truncate">{p.name}</span>
        {p.impact && (
          <span className="impact-badge">{p.impact}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{p.description}</p>
      <div className="flex flex-wrap gap-1">
        {p.tech.slice(0, 3).map((t) => (
          <span key={t} className="tech-pill">{t}</span>
        ))}
        {p.tech.length > 3 && (
          <span className="tech-pill">+{p.tech.length - 3}</span>
        )}
      </div>
    </>
  );

  return p.slug ? (
    <Link to={`/work/${p.slug}`} className="project-card group">
      {content}
    </Link>
  ) : (
    <div className="project-card">
      {content}
    </div>
  );
}

export default function Work() {
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [selectedTech, setSelectedTech] = useState(new Set());

  const hasFilters = selectedClients.size > 0 || selectedTech.size > 0;

  const selectedCompanies = useMemo(() => {
    if (selectedClients.size === 0) return null;
    const companies = new Set();
    selectedClients.forEach((client) => {
      const mapped = BRAND_TO_COMPANIES.get(client);
      if (mapped) mapped.forEach((c) => companies.add(c));
    });
    return companies;
  }, [selectedClients]);

  const filteredProjects = useMemo(() => {
    return KEY_PROJECTS
      .filter((g) => !selectedCompanies || selectedCompanies.has(g.company))
      .flatMap((g) =>
        g.projects
          .filter((p) => {
            if (selectedTech.size === 0) return true;
            return p.tech.some((t) => selectedTech.has(normTech(t)));
          })
          .map((p) => ({ ...p, company: g.company, logo: COMPANY_LOGO.get(g.company) }))
      );
  }, [selectedCompanies, selectedTech]);

  const clearFilters = () => {
    setSelectedClients(new Set());
    setSelectedTech(new Set());
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <Briefcase className="text-accent" width={20} height={20} />
        <h1 className="text-2xl font-bold">Work</h1>
      </div>

      {/* Filter row: project-linked brands + cross-cutting tech */}
      <section className="mb-10">
        <h2 className="section-label mb-4">
          <Building className="text-accent" width={12} height={12} />
          Filter by client or tech
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {BRANDS.filter((b) => BRAND_TO_COMPANIES.has(b.name)).map((b) => {
            const isActive = selectedClients.has(b.name);
            const isDimmed = hasFilters && !isActive;
            return (
              <button
                key={b.name}
                onClick={() => setSelectedClients(toggleSet(selectedClients, b.name))}
                className={`brand-chip brand-chip--filter ${isActive ? 'brand-chip--active' : ''} ${isDimmed ? 'brand-chip--dimmed' : ''}`}
                title={b.name}
              >
                <img src={b.logo} alt="" className="w-4 h-4 rounded-sm" loading="lazy" />
                <span>{b.name}</span>
              </button>
            );
          })}

          {CROSS_TECH.length > 0 && (
            <>
              <span className="text-gray-200 select-none mx-0.5">·</span>
              {CROSS_TECH.map((t) => {
                const isActive = selectedTech.has(t);
                const isDimmed = hasFilters && !isActive;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTech(toggleSet(selectedTech, t))}
                    className={`tech-pill tech-pill--filter ${isActive ? 'tech-pill--active' : ''} ${isDimmed ? 'tech-pill--dimmed' : ''}`}
                  >
                    {t}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Static client-only brands */}
        {(() => {
          const staticBrands = BRANDS.filter((b) => !BRAND_TO_COMPANIES.has(b.name));
          if (staticBrands.length === 0) return null;
          return (
            <p className="text-xs text-gray-400 mt-3">
              Also worked with{' '}
              {staticBrands.map((b, i) => (
                <span key={b.name}>
                  {i > 0 && ' · '}
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="link-underline">{b.name}</a>
                </span>
              ))}
            </p>
          );
        })()}
      </section>

      {/* Active filter bar */}
      {hasFilters && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-gray-400">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto"
          >
            <Close width={12} height={12} />
            Clear filters
          </button>
        </div>
      )}

      {/* Projects */}
      <section className="mb-14">
        <h2 className="section-label mb-6">
          <Folder className="text-accent" width={12} height={12} />
          Projects
        </h2>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-3">No projects match these filters.</p>
            <button onClick={clearFilters} className="text-sm text-accent hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProjects.map((p) => (
              <ProjectCard key={p.name} p={p} company={p.company} logo={p.logo} />
            ))}
          </div>
        )}
      </section>

      {/* Side Projects — hidden when filtering */}
      {!hasFilters && (
        <section>
          <h2 className="section-label mb-5">
            <Folder className="text-accent" width={12} height={12} />
            Side Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SIDE_PROJECTS.map((p) => (
              <a
                key={p.name}
                href={p.url || '#'}
                target={p.url ? '_blank' : undefined}
                rel={p.url ? 'noopener noreferrer' : undefined}
                className="side-project-card group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                  {p.url && <ExternalLink className="text-gray-300 group-hover:text-accent shrink-0 transition-colors" width={12} height={12} />}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{p.description}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Skills — hidden when filtering */}
      {!hasFilters && (
        <section className="mt-14">
          <h2 className="section-label mb-6">
            <Briefcase className="text-accent" width={12} height={12} />
            Skills
          </h2>
          <div className="space-y-4">
            {Object.entries(SKILLS).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2">{category}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span key={item} className="tech-pill">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strengths — hidden when filtering */}
      {!hasFilters && (
        <section className="mt-14">
          <h2 className="section-label mb-6">
            <Briefcase className="text-accent" width={12} height={12} />
            Strengths
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STRENGTHS.map((s) => (
              <div key={s.title} className="project-card">
                <span className="font-semibold text-sm text-gray-900 mb-1 block">{s.title}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transversal Skills — hidden when filtering */}
      {!hasFilters && (
        <section className="mt-14">
          <h2 className="section-label mb-6">
            <Briefcase className="text-accent" width={12} height={12} />
            Transversal Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRANSVERSAL_SKILLS.map((s) => (
              <div key={s.title} className="project-card">
                <span className="font-semibold text-sm text-gray-900 mb-1 block">{s.title}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
