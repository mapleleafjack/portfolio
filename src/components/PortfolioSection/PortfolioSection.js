import React, { useState } from 'react';
import './PortfolioSection.css';
import ScrollBox from '../ScrollBox/ScrollBox';



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



// Accept controlled panel index and change handler
const PortfolioSection = ({ selectedPanelIndex, onPanelIndexChange }) => {
  // If controlled, use prop; else, use local state
  const isControlled = typeof selectedPanelIndex === 'number';
  const [uncontrolledIndex, setUncontrolledIndex] = useState(null);
  const panelIndex = isControlled ? selectedPanelIndex : uncontrolledIndex;
  const setPanelIndex = (idx) => {
    if (isControlled) {
      onPanelIndexChange && onPanelIndexChange(idx);
    } else {
      setUncontrolledIndex(idx);
    }
  };

  const selectedTheme = panelIndex != null ? THEMES[panelIndex]?.key : null;

  // Find the highlights for the selected theme
  const selectedHighlights = selectedTheme
    ? themeHighlights.find((t) => t.theme === selectedTheme)?.highlights || []
    : [];

  // For connector line: get the position of the selected icon and panel
  const iconRowRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const [connectorStyle, setConnectorStyle] = useState(null);

  React.useEffect(() => {
    if (!selectedTheme) {
      setConnectorStyle(null);
      return;
    }
    // Find the selected icon button and the panel
    const iconRow = iconRowRef.current;
    const panel = panelRef.current;
    if (!iconRow || !panel) return;
    const iconBtns = iconRow.querySelectorAll('.icon-btn');
    const selectedIdx = THEMES.findIndex(t => t.key === selectedTheme);
    if (selectedIdx === -1) return;
    const iconBtn = iconBtns[selectedIdx];
    if (!iconBtn) return;
    // Get bounding rects
    const iconRect = iconBtn.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const containerRect = iconRow.parentNode.getBoundingClientRect();
    // Calculate start (icon center bottom) and end (panel top center) relative to container
    const startX = iconRect.left + iconRect.width / 2 - containerRect.left;
    const startY = iconRect.bottom - containerRect.top;
    const endY = panelRect.top - containerRect.top;
    setConnectorStyle({
      left: startX - 1.5, // center the 3px line
      top: startY,
      width: 3,
      height: Math.max(10, endY - startY),
      color: THEMES[selectedIdx]?.color || '#fff',
    });
  }, [selectedTheme]);


  return (
    <section className="portfolio-section">
      <div className="icon-row-wrapper">
        <div className="icon-row" ref={iconRowRef}>
          {THEMES.map((theme, idx) => (
            <button
              key={theme.key}
              className={`icon-btn${selectedTheme === theme.key ? ' selected' : ''}`}
              style={{ borderColor: theme.color, color: theme.color }}
              onMouseEnter={() => setPanelIndex(idx)}
              onMouseLeave={() => setPanelIndex(null)}
              aria-label={theme.label}
            >
              <span className="icon-emoji" style={{ color: theme.color }}>{theme.icon}</span>
            </button>
          ))}
        </div>
        {selectedTheme && connectorStyle && (
          <div
            className="connector-line"
            style={{
              left: connectorStyle.left,
              top: connectorStyle.top,
              width: connectorStyle.width,
              height: connectorStyle.height,
            }}
          >
            <svg width={connectorStyle.width} height={connectorStyle.height} style={{ display: 'block' }}>
              <line
                x1={connectorStyle.width / 2}
                y1={0}
                x2={connectorStyle.width / 2}
                y2={connectorStyle.height}
                stroke={connectorStyle.color}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }}
              />
            </svg>
          </div>
        )}
      </div>

      {selectedTheme && (
        <div className="category-panel fade-in" ref={panelRef} style={{ borderColor: THEMES[panelIndex]?.color }}>
          <div className="panel-header" style={{ color: THEMES[panelIndex]?.color }}>
            <span className="icon-emoji">{THEMES[panelIndex]?.icon}</span>
            <span className="panel-title">{THEMES[panelIndex]?.label}</span>
          </div>
          <ul className="panel-highlights">
            {selectedHighlights.map((hl, i) => (
              <li key={i}>
                <strong>{hl.text}</strong>
                <div className="highlight-techstack">
                  {hl.tech.map((tech) => (
                    <span className="tech-pill" key={tech}>{tech}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default PortfolioSection;
