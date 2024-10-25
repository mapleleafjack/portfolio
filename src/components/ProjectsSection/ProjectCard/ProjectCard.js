import React from 'react';
import { Link } from 'gatsby';
import './projectCard.css';

const ProjectCard = ({ title, description, link, textColor, skills }) => (
  <Link to={link} className="project-card" style={{ color: textColor }}>
    <div className="project-content">
      <h3 className="project-title">{title}</h3>
      <p className="project-description">{description}</p>
      <div className="project-skills">
        {skills.map((skill, index) => (
          <span key={index} className="project-skill">{skill}</span>
        ))}
      </div>
    </div>
  </Link>
);

export default ProjectCard;
