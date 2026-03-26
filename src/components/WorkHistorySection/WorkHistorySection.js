import React from 'react';
import { motion } from 'framer-motion';
import './workHistorySection.css';

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
      { name: 'LPA Extractor', tech: ['Python', 'LLM', 'RAG'], description: 'AI-powered legal document extraction', impact: '6h → 1h per document' },
      { name: 'Term Intelligence', tech: ['React', 'Python', 'GraphQL'], description: 'Fund term analysis product replacing PowerBI prototype' },
      { name: 'AI Dev Workflows', tech: ['Node.js', 'AI/LLM'], description: 'Reusable AI workflows for Jira, Bitbucket, Confluence' },
    ],
  },
  {
    company: 'Made Tech',
    tint: '255, 152, 0',
    projects: [
      { name: 'Housing Repairs SaaS', tech: ['React', 'Ruby on Rails', 'GOV.UK'], description: 'First SaaS product for local councils' },
      { name: 'Hackney Social Care', tech: ['React', '.NET', 'PostgreSQL'], description: 'Rebuilt critical public service after cyberattack' },
    ],
  },
  {
    company: 'Engage Hub',
    tint: '162, 89, 230',
    projects: [
      { name: 'Dragon Platform', tech: ['React', '.NET', 'SQL Server'], description: 'Enterprise comms automation for Bank of Ireland, Hermes, and others' },
    ],
  },
  {
    company: 'Sano Genetics',
    tint: '46, 204, 64',
    projects: [
      { name: 'Bio Pipeline Automation', tech: ['Python', 'AWS', 'NextFlow'], description: 'Automated cloud workflows for bioengineering research' },
    ],
  },
  {
    company: 'Sixs',
    tint: '0, 191, 174',
    projects: [
      { name: 'Social Care System', tech: ['C#', '.NET', 'SQL Server'], description: 'Full management system for social care cooperatives' },
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
    name: 'SlimeChan',
    url: 'https://www.slimechan.xyz/',
    github: 'https://github.com/mapleleafjack/slime-chan',
    description: 'LLM-powered interactive slime colony \u2014 each slime has its own personality and responds to conversation',
  },
  {
    name: 'Glypho',
    url: 'https://www.glypho.xyz/',
    description: 'Creative web experiment exploring generative art and typography',
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
          <h1 className="wh-title">Code</h1>
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
