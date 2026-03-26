import React from 'react';
import { motion } from 'framer-motion';
import './workHistorySection.css';

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

const brandLogo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const BRANDS = [
  { name: 'BlackRock', url: 'https://www.blackrock.com/', logo: brandLogo('blackrock.com') },
  { name: 'Made Tech', url: 'https://www.madetech.com/', logo: brandLogo('madetech.com') },
  { name: 'Sano Genetics', url: 'https://www.sanogenetics.com/', logo: brandLogo('sanogenetics.com') },
  { name: 'Engage Hub', url: 'https://www.engagehub.com/', logo: brandLogo('engagehub.com') },
  { name: 'Sixs', url: 'https://sixs.it/', logo: brandLogo('sixs.it') },
  { name: 'Gov.UK', url: 'https://www.gov.uk/', logo: brandLogo('gov.uk') },
  { name: 'Hackney Council', url: 'https://hackney.gov.uk/', logo: brandLogo('hackney.gov.uk') },
  { name: 'Camden Council', url: 'https://www.camden.gov.uk/', logo: brandLogo('camden.gov.uk') },
  { name: 'Bank of Ireland', url: 'https://www.bankofireland.com/', logo: brandLogo('bankofireland.com') },
  { name: 'Hermes', url: 'https://www.evri.com/', logo: brandLogo('evri.com') },
];

const KEY_PROJECTS = [
  {
    company: 'BlackRock',
    tint: '79, 107, 237',
    projects: [
      { name: 'LPA Extractor', tech: ['Python', 'LLM', 'RAG Chain'], description: 'AI-powered legal document extraction', impact: '6h → 1h per document for lawyers' },
      { name: 'Term Intelligence', tech: ['React', 'Python', 'GraphQL', 'Snowflake'], description: 'Fund term analysis product', impact: 'Replaced temporary PowerBI solution with polished product' },
      { name: 'Saved Search', tech: ['FastAPI', 'GraphQL', 'PostgreSQL'], description: 'Reusable backend feature for persisting user queries \u2014 cross-team adoption' },
      { name: 'Contact Sync System', tech: ['C#', '.NET', 'SharePoint'], description: 'Enterprise contact sync across 5 environments with credential rotation' },
      { name: 'Observability & Telemetry', tech: ['Apollo', 'Heap Analytics'], description: 'GraphQL telemetry for proactive issue detection post-deploy' },
      { name: 'CI Coverage Pipeline', tech: ['CI/CD', 'Python'], description: 'Repo-level test coverage in CI and review flow' },
      { name: 'AI Dev Workflows', tech: ['Node.js', 'AI/LLM'], description: 'Reusable AI-assisted workflows for Jira, Bitbucket, Confluence' },
    ],
  },
  {
    company: 'Made Tech',
    tint: '255, 152, 0',
    projects: [
      { name: 'Housing Repairs SaaS', tech: ['React', 'Ruby on Rails', 'GOV.UK'], description: 'First SaaS product for local councils', impact: 'Removed barriers between suppliers and tenants' },
      { name: 'Hackney Social Care', tech: ['React', '.NET', 'PostgreSQL'], description: 'Rebuilt critical public service after cyberattack', impact: 'Restored essential social care system from backups' },
    ],
  },
  {
    company: 'Engage Hub',
    tint: '162, 89, 230',
    projects: [
      { name: 'Dragon Platform', tech: ['React', '.NET', 'SQL Server'], description: 'Enterprise comms automation', impact: 'Streamlined comms for Bank of Ireland, Hermes, and others' },
      { name: 'Email Designer', tech: ['React', '.NET'], description: 'Drag & drop email template builder for Bank of Ireland' },
      { name: 'White-Label Engine', tech: ['React', 'SCSS'], description: 'Dynamic branding system for reselling the platform to enterprise clients' },
    ],
  },
  {
    company: 'Sano Genetics',
    tint: '46, 204, 64',
    projects: [
      { name: 'Bio Pipeline Automation', tech: ['Python', 'AWS', 'NextFlow'], description: 'Automated cloud workflows for bioengineering research', impact: 'Replaced manual local scripts with hosted pipelines' },
      { name: 'Infrastructure & CI', tech: ['Terraform', 'GitHub Actions'], description: 'Platform infrastructure and automated code quality pipelines' },
    ],
  },
  {
    company: 'Sixs',
    tint: '0, 191, 174',
    projects: [
      { name: 'Social Care Management System', tech: ['C#', '.NET', 'SQL Server'], description: 'Full gestionale for social care cooperatives \u2014 accountancy, scheduling, reporting' },
      { name: 'Companion Apps', tech: ['Android', 'Windows Phone', 'REST API'], description: 'Mobile apps with NFC time tracking for field social care workers' },
      { name: 'DB Migration System', tech: ['.NET', 'SQL Server'], description: 'Database migration tooling for evolving the production schema safely' },
    ],
  },
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
    description: 'Creative web experiment exploring generative art and typography',
  },
  {
    name: 'SlimeChan',
    url: 'https://www.slimechan.xyz/',
    github: 'https://github.com/mapleleafjack/slime-chan',
    description: 'LLM-powered interactive slime colony \u2014 each slime has its own personality and responds to conversation',
  },
  {
    name: 'EsPoi',
    description: 'Custom ESP32-based LED poi with full PCB design \u2014 BQ24074 power management, component standardisation, designed for home SMD assembly',
  },
  {
    name: 'BMO',
    github: 'https://github.com/mapleleafjack/BMO',
    description: 'ESP32 companion robot with OLED display \u2014 custom GPIO mapping, inspired by Adventure Time',
  },
  {
    name: 'Reactive Bus Installation',
    description: 'People-tracking AV installation across 4 zones \u2014 PIR sensors, addressable LEDs, generative audio, Raspberry Pi + Arduino',
  },
  {
    name: 'ESP Visualiser',
    description: 'ESP32-based audio-reactive LED visualiser \u2014 real-time frequency analysis driving addressable LED patterns',
  },
  {
    name: 'Festival Tech Tent',
    description: 'LED juggling prop sync station for Burning Mountain \u2014 centralised configuration for performer props using FlowToys protocol',
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

const WorkHistorySection = () => {

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
              <motion.a
                key={brand.name}
                variants={fadeUp}
                className="wh-brand-card"
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={brand.logo} alt={brand.name} className="wh-brand-logo" />
                <h4 className="wh-brand-name">{brand.name}</h4>
              </motion.a>
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

        <Section title="Key Projects" tint="79, 107, 237">
          <div className="wh-keyprojects-list">
            {KEY_PROJECTS.map((group) => (
              <motion.div key={group.company} variants={fadeUp} className="wh-keyprojects-group" style={{ '--tint': group.tint }}>
                <h3 className="wh-keyprojects-company">{group.company}</h3>
                <div className="wh-keyprojects-items">
                  {group.projects.map((project) => (
                    <div key={project.name} className="wh-keyproject-row">
                      <div className="wh-keyproject-header">
                        <h4 className="wh-keyproject-name">{project.name}</h4>
                        <div className="wh-keyproject-tech">
                          {project.tech.map((t) => (
                            <span key={t} className="wh-keyproject-tag">{t}</span>
                          ))}
                        </div>
                      </div>
                      <p className="wh-keyproject-desc">{project.description}</p>
                      {project.impact && <p className="wh-keyproject-impact">{project.impact}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
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
    </motion.section>
  );
};

export default WorkHistorySection;
