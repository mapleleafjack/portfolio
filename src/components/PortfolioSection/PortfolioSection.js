import React, { useState } from 'react';
import './PortfolioSection.css';
import ScrollBox from '../ScrollBox/ScrollBox';

const Tooltip = ({ text, children }) => (
  <span className="tooltip-container">
    {children}
    <span className="tooltip-text">{text}</span>
  </span>
);

const THEMES = [
  { key: 'innovation', label: 'AI Innovations', color: '#4f6bed', icon: '💡' },
  { key: 'healthcare', label: 'Healthcare Impact', color: '#2ecc40', icon: '🩺' },
  { key: 'gov', label: 'Government Solutions', color: '#a259e6', icon: '🏛️' },
  { key: 'automation', label: 'Automation & SaaS', color: '#ff9800', icon: '⚙️' },
  { key: 'iot', label: 'IoT & Mobile', color: '#00bfae', icon: '📱' },
];

const themeHighlights = [
  {
    theme: 'innovation',
    highlights: [
      {
        text: 'Developed a LPA Extractor solution using LLM (RAG Chain)',
        tooltip: 'Reduced time for extracting economic terms from 6 hours to 1 hour per LPA for lawyers',
        tech: ['LLM', 'RAG'],
      },
      {
        text: 'Transitioned software solutions from a temporary PowerBI setup to a robust React/Python implementation, emphasizing clean code and thorough testing',
        tooltip: 'Polished solution for end users, replacing temporary tools',
        tech: ['React', 'Python', 'PowerBI'],
      },
      {
        text: 'Contributed to team dynamics and technology guidelines',
        tech: [],
      },
    ],
  },
  {
    theme: 'healthcare',
    highlights: [
      {
        text: 'Expanded the bioengineering backend for healthcare research',
        tooltip: 'Enabled access to DNA analysis results',
        tech: ['AWS', 'NextFlow'],
      },
      {
        text: 'Developed synchronization scripts for lab results',
        tooltip: 'Automated data flow using AWS and NextFlow',
        tech: ['AWS', 'NextFlow'],
      },
      {
        text: 'Automated code quality checks with GitHub Actions',
        tech: ['GitHub Actions'],
      },
      {
        text: 'Optimized platform infrastructure using Terraform',
        tech: ['Terraform'],
      },
    ],
  },
  {
    theme: 'gov',
    highlights: [
      {
        text: 'Launched Housing Repair SaaS for local councils',
        tooltip: 'Bridged service suppliers and tenants',
        tech: ['SaaS', 'Gov.UK'],
      },
      {
        text: 'Restored Hackney Social Care service after a cyberattack',
        tooltip: 'Rebuilt application from backups',
        tech: ['Social Care'],
      },
      {
        text: 'Led development of Gov.UK Housing Repairs system',
        tech: ['Gov.UK'],
      },
      {
        text: 'Managed junior engineers and ensured efficient delivery',
        tech: ['Team Management'],
      },
      {
        text: 'Provided mentorship and participated in R&D discussions',
        tech: ['Mentorship', 'R&D'],
      },
    ],
  },
  {
    theme: 'automation',
    highlights: [
      {
        text: 'Expanded communication automation software (Dragon)',
        tooltip: 'Streamlined communications for services and end users',
        tech: ['Automation'],
      },
      {
        text: 'Designed an email drag-and-drop tool for Bank of Ireland',
        tech: ['Email Designer'],
      },
      {
        text: 'Implemented user permission management system',
        tech: ['Permission Management'],
      },
      {
        text: 'Developed white-labeling engine for application branding',
        tech: ['White-labelling'],
      },
    ],
  },
  {
    theme: 'iot',
    highlights: [
      {
        text: 'Maintained Social Care solution for employee accountancy',
        tech: ['Social Care'],
      },
      {
        text: 'Developed Android and Windows Phone app companions',
        tech: ['Android', 'Windows Phone', 'API'],
      },
      {
        text: 'Integrated NFC capabilities for time tracking',
        tooltip: 'Enabled efficient time tracking',
        tech: ['NFC'],
      },
      {
        text: 'Provided customer support for technical solutions',
        tech: ['Customer Support'],
      },
    ],
  },
];

const PortfolioSection = () => {
  return (
    <section className="portfolio-section">
      <h2>Portfolio Analysis</h2>
      <ScrollBox>
        <div className="portfolio-analysis">
          <div className="common-skills">
            <h3>Common Skills & Technologies</h3>
            <div className="common-elements">
              {Array.from(new Set(
                themeHighlights.flatMap((theme) =>
                  theme.highlights.flatMap((hl) => hl.tech)
                )
              )).map((tech) => (
                <span className="tech-pill common" key={tech}>{tech}</span>
              ))}
            </div>
          </div>

          <div className="category-mix">
            <h3>Mixed Categories</h3>
            {THEMES.map((theme) => (
              <div
                className="theme-box"
                key={theme.key}
                style={{ borderColor: theme.color, background: theme.color + '22' }}
              >
                <div className="theme-header" style={{ color: theme.color }}>
                  <span className="theme-icon">{theme.icon}</span> {theme.label}
                </div>
                <ul className="theme-highlights">
                  {themeHighlights
                    .flatMap((t) => t.highlights)
                    .filter((hl) => hl.tech.some((tech) => themeHighlights
                      .find((th) => th.theme === theme.key)?.highlights
                      .flatMap((h) => h.tech)
                      .includes(tech)))
                    .map((hl, i) => (
                      <li key={i}>
                        <strong>{hl.text}</strong>
                        {hl.tooltip ? <Tooltip text={hl.tooltip}>🛈</Tooltip> : null}
                        <div className="highlight-techstack">
                          {hl.tech.map((tech) => (
                            <span className="tech-pill" key={tech}>{tech}</span>
                          ))}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </ScrollBox>
    </section>
  );
};

export default PortfolioSection;
