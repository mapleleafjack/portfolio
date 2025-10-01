import React from 'react';
import './PortfolioSection.css';


const Tooltip = ({ text, children }) => (
  <span className="tooltip-container">
    {children}
    <span className="tooltip-text">{text}</span>
  </span>
);

const PortfolioSection = () => {
  return (
    <section className="portfolio-section">
      <h2>Portfolio</h2>

      {/* BlackRock */}
      <div className="cv-entry">
        <h3>BlackRock</h3>
        <ul>
          <li>
            Developed a LPA Extractor solution using LLM (RAG Chain)
            <Tooltip text="LPA extractor reduced time for extracting economic terms from 6 hours to 1 hour per LPA for lawyers">🛈</Tooltip>
          </li>
          <li>
            Migrated software solutions from PowerBI to React/Python (Term intelligence) with focus on clean code and tests
            <Tooltip text="Term Intelligence migration makes it a final polished solution for end users (instead of a temporary one built with pre-existing tools)">🛈</Tooltip>
          </li>
          <li>Active participation in team dynamics in deciding technology and code guidelines</li>
        </ul>
      </div>

      {/* Sano Genetics */}
      <div className="cv-entry">
        <h3>Sano Genetics</h3>
        <ul>
          <li>
            Designed and expanded the bioengineering backend to support healthcare research results publishing
            <Tooltip text="BIO backend helps user accessing data from analysis of their DNA samples">🛈</Tooltip>
          </li>
          <li>
            Developed synchronisation scripts to ensure data flow between lab results and bio pipelines, leveraging AWS bucket triggers and NextFlow pipelines
            <Tooltip text="Synch scripts helped bio engineers NOT use local scripts, and instead hosting them on NextFlow and triggering them via AWS once the results of the pipeline are uploaded by the analysis company">🛈</Tooltip>
          </li>
          <li>Created and maintained GitHub Actions workflows to automate code quality checks</li>
          <li>Expanded and optimised the platform infrastructure using Terraform</li>
        </ul>
      </div>

      {/* Made Tech */}
      <div className="cv-entry">
        <h3>Made Tech</h3>
        <ul>
          <li>
            Built and launched the company's first SaaS solution (Housing repair for local councils)
            <Tooltip text="Housing Repairs for local council removed the barrier between service suppliers and council houses tenants">🛈</Tooltip>
          </li>
          <li>
            Restored the Hackney Social Care service after a cyberattack  that prevented the service from working
            <Tooltip text="I was part of the squad that restored the Hackney Social Care service from backups, rewriting the application that supported it">🛈</Tooltip>
          </li>
          <li>Led the development of the Gov.UK Housing Repairs and Hackney Social Care system</li>
          <li>Managed a team of junior engineer, delegated tasks based on individual expertise, ensuring efficient project delivery.</li>
          <li>Provided mentorship for professional growth</li>
          <li>Participated actively in R&D technological discussion</li>
        </ul>
      </div>

      {/* Engage Hub */}
      <div className="cv-entry">
        <h3>Engage Hub</h3>
        <ul>
          <li>
            Developed and expanded the company's communication automation software solution
            <Tooltip text="The software 'Dragon' goal is to make communications streamlined between services and end users: for example communications for password resets and bank statements (Bank of Ireland), keeping update the user on parcels status (Hermes)">🛈</Tooltip>
          </li>
          <li>Designed and implemented an email drag&drop designer for Bank of Ireland communication</li>
          <li>Implemented a permission management system for users to load different parts of the application</li>
          <li>Wrote a white-labelling engine for branding the application to be sold</li>
        </ul>
      </div>

      {/* Sixs */}
      <div className="cv-entry">
        <h3>Sixs</h3>
        <ul>
          <li>Developed and maintained a Social Care solution for accountancy purposes of Social Care employees</li>
          <li>Designed and developed Android and Windows Phone app companions, together with the Social Care API</li>
          <li>Integrated NFC capabilities for time tracking capabilities</li>
          <li>Provided customer support</li>
        </ul>
      </div>

      {/* Example chart placeholder */}
      <div className="chart-placeholder">
        <p>[Chart will go here]</p>
      </div>
    </section>
  );
};

export default PortfolioSection;
