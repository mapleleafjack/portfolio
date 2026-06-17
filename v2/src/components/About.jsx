import { Briefcase, User, Zap } from 'pixelarticons/react';
import { SKILLS, STRENGTHS, TRANSVERSAL_SKILLS } from '../data';

export default function About() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <User className="text-accent" width={20} height={20} />
        <h1 className="text-2xl font-bold">About</h1>
      </div>

      {/* Skills */}
      <section className="mb-14">
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

      {/* Strengths */}
      <section className="mb-14">
        <h2 className="section-label mb-6">
          <Zap className="text-accent" width={12} height={12} />
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

      {/* Transversal Skills */}
      <section>
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
    </div>
  );
}
