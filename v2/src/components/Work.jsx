import { BRANDS, KEY_PROJECTS, SKILLS } from '../data';
import { Briefcase, Folder, Terminal, Cloud, Checkbox, Cpu, Building } from 'pixelarticons/react';

const CATEGORY_ICONS = {
  Languages: Terminal,
  Frameworks: Folder,
  Infrastructure: Cloud,
  Practices: Checkbox,
  Other: Cpu,
};

export default function Work() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-12">
        <Briefcase className="text-accent" width={20} height={20} />
        <h1 className="text-2xl font-bold">Work</h1>
      </div>

      {/* Brands */}
      <section className="mb-14">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Building className="text-accent" width={12} height={12} />
          Clients &amp; Experience
        </h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
          {BRANDS.map((b, i) => (
            <span key={b.name}>
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="font-medium link-underline">{b.name}</a>
              {i < BRANDS.length - 1 && <span className="text-gray-300 mx-0.5">·</span>}
            </span>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-14">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-5">
          <Folder className="text-accent" width={12} height={12} />
          Projects
        </h2>
        <div className="space-y-5">
          {KEY_PROJECTS.map((group) => (
            <div key={group.company}>
              <h3 className="text-sm font-semibold text-black mb-2">{group.company}</h3>
              <div className="space-y-1.5">
                {group.projects.map((p) => (
                  <div key={p.name} className="flex flex-wrap items-baseline gap-x-3 text-sm pl-0 sm:pl-3 border-l-2 border-gray-100 hover:border-accent transition-colors">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-gray-500">
                      {p.description}
                      {p.impact && <span className="text-accent ml-1">— {p.impact}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Terminal className="text-accent" width={12} height={12} />
          Skills
        </h2>
        <div className="space-y-2">
          {Object.entries(SKILLS).map(([cat, items]) => {
            const Icon = CATEGORY_ICONS[cat] || Terminal;
            return (
              <div key={cat} className="flex items-baseline gap-2 text-sm">
                <Icon className="shrink-0 text-accent mt-0.5" width={12} height={12} />
                <span>
                  <span className="text-gray-500">{cat}</span>{' '}
                  <span className="text-gray-700">{items.join(', ')}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
