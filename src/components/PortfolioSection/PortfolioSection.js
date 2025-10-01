

import React, { useState } from 'react';
import './PortfolioSection.css';
import ScrollBox from '../ScrollBox/ScrollBox';

const Tooltip = ({ text, children }) => (
  <span className="tooltip-container">
    {children}
    <span className="tooltip-text">{text}</span>
  </span>
);

const CATEGORIES = [
  { key: 'ai', label: 'AI & Data', color: '#4f6bed', icon: '🤖' },
  { key: 'bio', label: 'Healthcare & Bio', color: '#2ecc40', icon: '🧬' },
  { key: 'gov', label: 'Gov & Social Impact', color: '#a259e6', icon: '🏛️' },
  { key: 'saas', label: 'SaaS & Automation', color: '#ff9800', icon: '⚙️' },
  { key: 'iot', label: 'Mobile & IoT', color: '#00bfae', icon: '📱' },
];

const portfolioData = [
  {
    company: 'BlackRock',
    category: 'ai',
    years: '2023-2024',
    highlights: [
      {
        text: 'Developed a LPA Extractor solution using LLM (RAG Chain)',
        tooltip: 'LPA extractor reduced time for extracting economic terms from 6 hours to 1 hour per LPA for lawyers',
      },
      {
        text: 'Migrated software solutions from PowerBI to React/Python (Term intelligence) with focus on clean code and tests',
        tooltip: 'Term Intelligence migration makes it a final polished solution for end users (instead of a temporary one built with pre-existing tools)',
      },
      { text: 'Active participation in team dynamics in deciding technology and code guidelines' },
    ],
    techStack: ['LLM', 'RAG', 'React', 'Python', 'PowerBI'],
  },
  {
    company: 'Sano Genetics',
    category: 'bio',
    years: '2022-2023',
    highlights: [
      {
        text: 'Designed and expanded the bioengineering backend to support healthcare research results publishing',
        tooltip: 'BIO backend helps user accessing data from analysis of their DNA samples',
      },
      {
        text: 'Developed synchronisation scripts to ensure data flow between lab results and bio pipelines, leveraging AWS bucket triggers and NextFlow pipelines',
        tooltip: 'Synch scripts helped bio engineers NOT use local scripts, and instead hosting them on NextFlow and triggering them via AWS once the results of the pipeline are uploaded by the analysis company',
      },
      { text: 'Created and maintained GitHub Actions workflows to automate code quality checks' },
      { text: 'Expanded and optimised the platform infrastructure using Terraform' },
    ],
    techStack: ['AWS', 'NextFlow', 'Terraform', 'GitHub Actions'],
  },
  {
    company: 'Made Tech',
    category: 'gov',
    years: '2021-2022',
    highlights: [
      {
        text: 'Built and launched the company\'s first SaaS solution (Housing repair for local councils)',
        tooltip: 'Housing Repairs for local council removed the barrier between service suppliers and council houses tenants',
      },
      {
        text: 'Restored the Hackney Social Care service after a cyberattack  that prevented the service from working',
        tooltip: 'I was part of the squad that restored the Hackney Social Care service from backups, rewriting the application that supported it',
      },
      { text: 'Led the development of the Gov.UK Housing Repairs and Hackney Social Care system' },
      { text: 'Managed a team of junior engineer, delegated tasks based on individual expertise, ensuring efficient project delivery.' },
      { text: 'Provided mentorship for professional growth' },
      { text: 'Participated actively in R&D technological discussion' },
    ],
    techStack: ['SaaS', 'Gov.UK', 'Social Care', 'Team Lead'],
  },
  {
    company: 'Engage Hub',
    category: 'saas',
    years: '2020-2021',
    highlights: [
      {
        text: 'Developed and expanded the company\'s communication automation software solution',
        tooltip: 'The software \'Dragon\' goal is to make communications streamlined between services and end users: for example communications for password resets and bank statements (Bank of Ireland), keeping update the user on parcels status (Hermes)',
      },
      { text: 'Designed and implemented an email drag&drop designer for Bank of Ireland communication' },
      { text: 'Implemented a permission management system for users to load different parts of the application' },
      { text: 'Wrote a white-labelling engine for branding the application to be sold' },
    ],
    techStack: ['Automation', 'Email Designer', 'White-labelling'],
  },
  {
    company: 'Sixs',
    category: 'iot',
    years: '2018-2020',
    highlights: [
      { text: 'Developed and maintained a Social Care solution for accountancy purposes of Social Care employees' },
      { text: 'Designed and developed Android and Windows Phone app companions, together with the Social Care API' },
      { text: 'Integrated NFC capabilities for time tracking capabilities' },
      { text: 'Provided customer support' },
    ],
    techStack: ['Android', 'Windows Phone', 'NFC', 'API'],
  },
];

function getCategoryMeta(key) {
  return CATEGORIES.find((cat) => cat.key === key) || {};
}

const CategoryFilter = ({ categories, selected, onSelect }) => (
  <div className="category-filter">
    {categories.map((cat) => (
      <button
        key={cat.key}
        className={`filter-chip${selected.includes(cat.key) ? ' selected' : ''}`}
        style={{ background: selected.includes(cat.key) ? cat.color : 'rgba(40,40,40,0.7)', color: selected.includes(cat.key) ? '#fff' : cat.color, borderColor: cat.color }}
        onClick={() => onSelect(cat.key)}
      >
        <span className="chip-icon">{cat.icon}</span> {cat.label}
      </button>
    ))}
  </div>
);

const PortfolioSection = () => {
  const [selectedCategories, setSelectedCategories] = useState(CATEGORIES.map((c) => c.key));

  const handleCategorySelect = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  return (
    <section className="portfolio-section">
      <h2>Portfolio</h2>
      <CategoryFilter categories={CATEGORIES} selected={selectedCategories} onSelect={handleCategorySelect} />
      <ScrollBox>
        <div className="portfolio-categories">
          {CATEGORIES.filter((cat) => selectedCategories.includes(cat.key)).map((cat) => (
            <div className="portfolio-category-box" key={cat.key} style={{ borderColor: cat.color, background: cat.color + '22' }}>
              <div className="category-header" style={{ color: cat.color }}>
                <span className="category-icon">{cat.icon}</span> {cat.label}
              </div>
              <div className="category-companies">
                {portfolioData.filter((item) => item.category === cat.key).map((item) => (
                  <div className="company-card" key={item.company} style={{ borderColor: cat.color }}>
                    <div className="company-header">
                      <span className="company-name">{item.company}</span>
                      <span className="company-years">{item.years}</span>
                    </div>
                    <ul className="company-highlights">
                      {item.highlights.map((hl, i) => (
                        <li key={i}>
                          {hl.tooltip ? (
                            <Tooltip text={hl.tooltip}>🛈</Tooltip>
                          ) : null}
                          {hl.text}
                        </li>
                      ))}
                    </ul>
                    <div className="company-techstack">
                      {item.techStack.map((tech) => (
                        <span className="tech-pill" key={tech}>{tech}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="chart-placeholder">
          <p>[Chart will go here]</p>
        </div>
      </ScrollBox>
    </section>
  );
};

export default PortfolioSection;
