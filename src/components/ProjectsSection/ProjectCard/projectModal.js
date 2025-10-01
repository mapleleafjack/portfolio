import React from "react";
import "./projectModal.css";

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;
  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="project-modal" onClick={e => e.stopPropagation()}>
        <button className="project-modal-close" onClick={onClose} aria-label="Close project details">×</button>
        <div className="project-modal-header">
          {project.image ? (
            <img src={project.image} alt={project.title + ' logo'} className="project-modal-image" />
          ) : null}
          <h2 className="project-modal-title">{project.title}</h2>
        </div>
        <div className="project-modal-body">
          <p className="project-modal-description">{project.description}</p>
          <div className="project-modal-skills">
            {project.skills && project.skills.map((skill, idx) => (
              <span key={idx} className={`project-skill project-skill--modal`}>{skill}</span>
            ))}
          </div>
          {project.link && (
            <a href={project.link} className="project-modal-link" target="_blank" rel="noopener noreferrer">View Project</a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
