import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './workHistorySection.css';

const EXPERIENCE = [
  {
    company: 'BlackRock',
    role: 'Software Engineer',
    current: true,
    tint: '79, 107, 237',
    bullets: [
      'Developed an LPA Extractor solution using LLM (RAG Chain) \u2014 reduced extraction time from 6 hours to 1 hour per LPA for lawyers',
      'Migrated software solutions from PowerBI to React/Python (Term Intelligence) with focus on clean code and tests \u2014 polished end-user product replacing a temporary solution',
      'Active participation in team dynamics, deciding technology and code guidelines',
    ],
  },
  {
    company: 'Sano Genetics',
    role: 'Software Engineer',
    tint: '46, 204, 64',
    bullets: [
      'Designed and expanded a bioengineering backend to support healthcare research results publishing \u2014 enabled users to access data from their DNA sample analyses',
      'Developed synchronisation scripts for data flow between lab results and bio pipelines, leveraging AWS bucket triggers and NextFlow pipelines',
      'Created and maintained GitHub Actions workflows to automate code quality checks',
      'Expanded and optimised the platform infrastructure using Terraform',
    ],
  },
  {
    company: 'Made Tech',
    role: 'Software Engineer / Tech Lead',
    tint: '255, 152, 0',
    bullets: [
      'Built and launched the company\u2019s first SaaS solution (Housing Repairs for local councils) \u2014 removed the barrier between service suppliers and council house tenants',
      'Restored the Hackney Social Care service after a cyberattack \u2014 part of the squad that rebuilt the application from backups',
      'Led the development of the Gov.UK Housing Repairs and Hackney Social Care system',
      'Managed a team of junior engineers, delegated tasks based on expertise, ensuring efficient project delivery',
      'Provided mentorship for professional growth',
    ],
  },
  {
    company: 'Engage Hub',
    role: 'Software Engineer',
    tint: '162, 89, 230',
    bullets: [
      'Developed and expanded the communication automation software \u201cDragon\u201d \u2014 streamlined comms for Bank of Ireland, Hermes, and other clients',
      'Designed and implemented an email drag & drop designer for Bank of Ireland',
      'Implemented a permission management system for loading different application modules',
      'Wrote a white-labelling engine for branding the application for resale',
    ],
  },
  {
    company: 'Sixs',
    role: 'Software Engineer',
    tint: '0, 191, 174',
    bullets: [
      'Developed and maintained a Social Care solution for accountancy purposes',
      'Designed and developed Android and Windows Phone app companions with the Social Care API',
      'Integrated NFC capabilities for time tracking',
    ],
  },
];

const FOCUS_AREAS = [
  {
    title: 'AI-Augmented Engineering',
    tint: '79, 107, 237',
    bullets: [
      'Built reusable AI-driven workflows for investigations, documentation, and code review',
      'Daily AI-pair programming with custom context frameworks',
      'Created AI-ready documentation patterns adopted by the team',
    ],
  },
  {
    title: 'Neurodiversity Advocacy',
    tint: '162, 89, 230',
    bullets: [
      'Designing workshops on ADHD-friendly engineering workflows',
      'Active member of neurodiversity community within a large financial institution',
      'Building inclusive practices \u2014 written follow-ups, async-first communication, explicit scope',
    ],
  },
  {
    title: 'Architectural Ownership',
    tint: '230, 69, 69',
    bullets: [
      'Led production incident investigations across full stack (frontend \u2192 GraphQL \u2192 API \u2192 database)',
      'Created operational runbooks and architecture docs adopted as team standards',
      'Systematic root cause analysis across multiple investigations',
    ],
  },
  {
    title: 'Cross-Team Influence',
    tint: '46, 204, 64',
    bullets: [
      'Built reusable backend features designed for cross-team adoption',
      'Created deploy guides, testing infrastructure, and documentation standards',
      'Mentored junior engineers through blockers and team processes',
    ],
  },
];

const BRANDS = [
  { name: 'Gov.UK', context: 'Housing Repairs digital service' },
  { name: 'BlackRock', context: 'Aladdin platform \u2014 LPA extraction & Term Intelligence' },
  { name: 'Hackney Council', context: 'Social Care system restoration after cyberattack' },
  { name: 'Camden Council', context: 'Housing Repairs SaaS rollout' },
  { name: 'Bank of Ireland', context: 'Communication automation & email designer' },
  { name: 'Hermes', context: 'Parcel tracking communications' },
  { name: 'Sano Genetics', context: 'Bioengineering research platform' },
  { name: 'Engage Hub', context: 'Enterprise communication platform (Dragon)' },
  { name: 'Sixs', context: 'Social Care accountancy solution' },
];

const IMPACT = [
  { what: 'LPA Extractor', where: 'BlackRock', result: '6 hours \u2192 1 hour per document for lawyers' },
  { what: 'Term Intelligence', where: 'BlackRock', result: 'Replaced temporary PowerBI solution with polished React/Python product' },
  { what: 'Housing Repairs SaaS', where: 'Made Tech', result: 'First SaaS product \u2014 removed barriers between suppliers and tenants' },
  { what: 'Hackney Social Care', where: 'Made Tech', result: 'Rebuilt critical public service after cyberattack' },
  { what: 'Bio Pipeline Automation', where: 'Sano', result: 'Replaced manual local scripts with automated cloud workflows' },
  { what: 'Dragon Platform', where: 'Engage Hub', result: 'Streamlined comms for Bank of Ireland, Hermes, and others' },
];

const SKILLS = {
  languages: ['Python', 'JavaScript / TypeScript', 'C#', 'C++', 'Java'],
  frameworks: ['React', 'FastAPI', 'GraphQL (Strawberry)', '.NET'],
  infra: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'PostgreSQL', 'NextFlow'],
  practices: ['Clean Architecture', 'RESTful APIs', 'CI/CD', 'Code Reviews', 'GitHub / Bitbucket'],
  other: ['Arduino / ESP32', 'Android', 'Linux'],
};

const PROJECTS = [
  {
    name: 'Glypho',
    url: 'https://www.glypho.xyz/',
    description: 'Creative web project',
  },
  {
    name: 'SlimeChan',
    url: 'https://www.slimechan.xyz/',
    github: 'https://github.com/mapleleafjack/slime-chan',
    description: 'Uses LLM to interact with a group of slimes \u2014 a fun, creative AI project',
  },
  {
    name: 'LED Juggling Prop',
    description: 'Custom hardware project \u2014 designed PCB schematic for LED juggling props',
  },
  {
    name: 'ESP Visualiser',
    description: 'ESP32-based audio/visual project',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const Section = ({ title, tint, children }) => (
  <motion.div
    variants={fadeUp}
    className="wh-block"
    style={tint ? { '--tint': tint } : undefined}
  >
    <h2 className="wh-heading">{title}</h2>
    {children}
  </motion.div>
);

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
  exit: { x: '100%', opacity: 0, transition: { type: 'tween', duration: 0.2, ease: 'easeIn' } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const Drawer = ({ job, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="wh-drawer-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      />
      <motion.aside
        className="wh-drawer"
        variants={drawerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ '--tint': job.tint }}
      >
        <button className="wh-drawer-close" onClick={onClose}>&times;</button>
        <h2 className="wh-drawer-title">{job.company}</h2>
        <p className="wh-drawer-role">{job.role}{job.current ? ' \u2014 Current' : ''}</p>
        <ul className="wh-drawer-bullets">
          {job.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </motion.aside>
    </>
  );
};

const WorkHistorySection = () => {
  const [activeJob, setActiveJob] = useState(null);
  const closeDrawer = useCallback(() => setActiveJob(null), []);

  return (
    <motion.section
      className="wh-section"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <div className="wh-container">
        <motion.header variants={fadeUp} className="wh-hero">
          <h1 className="wh-title">Experience</h1>
          <p className="wh-subtitle">
            From healthcare to fintech &mdash; building software that matters.
          </p>
        </motion.header>

        <Section title="Brands I've Worked With" tint="255, 152, 0">
          <div className="wh-brands-grid">
            {BRANDS.map((brand) => (
              <motion.div key={brand.name} variants={fadeUp} className="wh-brand-card">
                <h4 className="wh-brand-name">{brand.name}</h4>
                <p className="wh-brand-context">{brand.context}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title="What I Focus On" tint="0, 191, 174">
          <div className="wh-focus-grid">
            {FOCUS_AREAS.map((area) => (
              <motion.div
                key={area.title}
                variants={fadeUp}
                className="wh-focus-card"
                style={{ '--tint': area.tint }}
              >
                <h4 className="wh-focus-title">{area.title}</h4>
                <ul className="wh-focus-bullets">
                  {area.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title="Key Impact" tint="230, 69, 69">
          <div className="wh-impact-grid">
            {IMPACT.map((item) => (
              <motion.div key={item.what} variants={fadeUp} className="wh-impact-card">
                <h4 className="wh-impact-what">{item.what}</h4>
                <span className="wh-impact-where">{item.where}</span>
                <p className="wh-impact-result">{item.result}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title="Career Timeline" tint="79, 107, 237">
          <div className="wh-timeline">
            {EXPERIENCE.map((job) => (
              <motion.button
                key={job.company}
                variants={fadeUp}
                className="wh-timeline-item"
                onClick={() => setActiveJob(job)}
                style={{ '--tint': job.tint }}
              >
                <span className="wh-timeline-dot" />
                <div className="wh-timeline-content">
                  <span className="wh-timeline-company">
                    {job.company}
                    {job.current && <span className="wh-timeline-badge">Current</span>}
                  </span>
                  <span className="wh-timeline-role">{job.role}</span>
                </div>
                <span className="wh-timeline-arrow">&rsaquo;</span>
              </motion.button>
            ))}
          </div>
        </Section>

        <Section title="Technical Skills" tint="46, 204, 64">
          <div className="wh-skills-grid">
            {Object.entries(SKILLS).map(([category, items]) => (
              <div key={category} className="wh-skill-group">
                <h3 className="wh-skill-category">{category}</h3>
                <div className="wh-skill-tags">
                  {items.map((skill) => (
                    <motion.span key={skill} variants={fadeUp} className="wh-skill-tag">
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Side Projects" tint="162, 89, 230">
          <div className="wh-projects-grid">
            {PROJECTS.map((project) => (
              <motion.div key={project.name} variants={fadeUp} className="wh-project-card">
                <h4 className="wh-project-name">
                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a>
                  ) : project.name}
                </h4>
                <p className="wh-project-desc">{project.description}</p>
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="wh-project-link">
                    GitHub &rarr;
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </Section>

        <motion.footer variants={fadeUp} className="wh-footer">
          <a href="https://github.com/mapleleafjack" target="_blank" rel="noopener noreferrer" className="wh-footer-link">GitHub</a>
          <span className="wh-footer-sep">&middot;</span>
          <a href="https://www.linkedin.com/in/jackmusajo" target="_blank" rel="noopener noreferrer" className="wh-footer-link">LinkedIn</a>
        </motion.footer>
      </div>

      <AnimatePresence>
        {activeJob && <Drawer job={activeJob} onClose={closeDrawer} />}
      </AnimatePresence>
    </motion.section>
  );
};

export default WorkHistorySection;
