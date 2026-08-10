import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Briefcase, Calendar, ChevronRight } from 'pixelarticons/react';
import { KEY_PROJECTS } from '../data';

const SECTION_ICONS = {
  'The Problem': '🔍',
  'The Situation': '🔍',
  'What I Built': '🛠',
  'What I Did': '🛠',
  'What the Platform Did': '🛠',
  'My Approach': '🧭',
  'Architecture': '📐',
  'Impact': '📈',
  'Key Technical Decisions': '⚙️',
  'Team Leadership': '👥',
  'What I Learned': '💡',
  'Workflows Created': '⚡',
  'Infrastructure': '🏗',
};

const HIGHLIGHT_SECTIONS = new Set(['Impact', 'The Problem', 'The Situation']);

export default function Project() {
  const { slug } = useParams();

  const group = KEY_PROJECTS.find((g) =>
    g.projects.some((p) => p.slug === slug)
  );
  const project = group?.projects.find((p) => p.slug === slug);

  if (!project || !project.detail) {
    return (
      <div>
        <p className="text-sm text-gray-400">Project not found.</p>
        <p className="text-sm mt-2"><Link to="/work" className="inline-flex items-center gap-1"><ArrowLeft width={14} height={14} /> Back</Link></p>
      </div>
    );
  }

  const { detail } = project;

  return (
    <div>
      {/* Back nav with company context */}
      <Link to="/work" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
        <ArrowLeft width={14} height={14} />
        <span>{group.company} — Work</span>
      </Link>

      {/* Hero */}
      <h1 className="text-3xl font-bold mb-2 tracking-tight">{project.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{detail.subtitle}</p>

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5">
        <span className="detail-meta">
          <Briefcase className="text-accent" width={12} height={12} /> {detail.role}
        </span>
        <span className="detail-meta">
          <Calendar className="text-accent" width={12} height={12} /> {detail.period}
        </span>
      </div>

      {/* Tech pills */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {project.tech.map((t) => (
          <span key={t} className="tech-pill">{t}</span>
        ))}
      </div>

      {/* Live URL */}
      {detail.liveUrl && (
        <a
          href={detail.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="live-url-cta"
        >
          <ExternalLink className="text-accent" width={14} height={14} />
          <span>View live — {detail.liveUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
        </a>
      )}

      {/* Overview */}
      <p className="text-base leading-relaxed text-gray-700 mb-10">{detail.overview}</p>

      {/* Sections */}
      {detail.sections.map((section) => {
        const isHighlight = HIGHLIGHT_SECTIONS.has(section.title);
        const hasList = !!section.items;

        return (
          <section
            key={section.title}
            className={`detail-section ${isHighlight ? 'detail-section--highlight' : ''} ${hasList ? 'detail-section--list' : ''}`}
          >
            <h2 className="section-label mb-3">
              <span>{SECTION_ICONS[section.title] || '▪'}</span>
              {section.title}
            </h2>
            {section.content && (
              <p className="text-sm leading-relaxed text-gray-600">{section.content}</p>
            )}
            {section.items && (
              <ul className="text-sm text-gray-600 space-y-2.5 list-none p-0">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="text-accent mt-0.5 shrink-0" width={14} height={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
