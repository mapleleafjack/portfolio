import React from 'react';
import { Link } from 'gatsby';

const ProjectCard = ({ image, title, description, link, gradient }) => (
<div className="project-card" style={{ background: gradient }}>
    <div className="project-content">
    <h3 className="project-title">{title}</h3>
    <p className="project-description">{description}</p>
    <Link to={link}>View more</Link>
    </div>
</div>
);

export default ProjectCard; // This should be default
