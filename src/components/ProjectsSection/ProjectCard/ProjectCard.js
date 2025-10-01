import React from 'react';
// import { Link } from 'gatsby';
import './projectCard.css';


// Accepts optional image prop for project logo/visual

// Map skill to category class
const skillCategoryClass = (skill) => {
  // Define your categories and their skills
  const categories = {
    'software': ["JavaScript", "Python", "TypeScript", "React", "Node.js", "Gatsby", "Docker", "AWS"],
    'hardware': ["Arduino", "ESP32", "Raspberry Pi", "PCB", "IoT"],
    'cloud': ["AWS", "Azure", "GCP", "Docker", "Kubernetes"],
    'other': [] // fallback
  };
  if (categories.software.includes(skill)) return 'project-skill--software';
  if (categories.hardware.includes(skill)) return 'project-skill--hardware';
  if (categories.cloud.includes(skill)) return 'project-skill--cloud';
  return 'project-skill--other';
};


const ProjectCard = ({ title, description, link, textColor, skills, image, onClick }) => (
  <div
    className="project-card"
    style={{ color: textColor }}
    tabIndex={0}
    role="button"
    onClick={onClick}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onClick && onClick(); } }}
    aria-label={`Open details for ${title}`}
  >
    <div className="project-card-inner">
      <div className="project-image-wrapper">
        {image ? (
          <img src={image} alt={title + ' logo'} className="project-image" />
        ) : (
          <div className="project-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#222" />
              <path d="M12 36L36 12M12 12L36 36" stroke="#444" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="project-content">
        <h3 className="project-title">{title}</h3>
        <p className="project-description">{description}</p>
        <div className="project-skills">
          {skills.map((skill, index) => (
            <span key={index} className={`project-skill ${skillCategoryClass(skill)}`}>{skill}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ProjectCard;
