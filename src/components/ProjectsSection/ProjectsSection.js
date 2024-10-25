// components/ProjectsSection/ProjectsSection.js
import React, { useState } from 'react';
import ProjectCard from './ProjectCard/ProjectCard';
import './projectsSection.css';

const projects = [
  {
    title: "Magic Mushroom LED Strip",
    description: "A visually striking, circular LED strip project designed to evoke a psychedelic effect.",
    link: "/projects/magic-mushroom",
    textColor: "#ff00ff",
    skills: ["Arduino", "ESP32"]
  },
  {
    title: "ESP32 TamagoChing",
    description: "A mindful digital pet project that evolves with user meditation and breathing exercises.",
    link: "/projects/tamagoching",
    textColor: "#00ffff",
    skills: ["ESP32", "JavaScript"]
  },
  {
    title: "Binance Python CLI Tool",
    description: "A tool to interact with the Binance API for fetching balances and executing trades.",
    link: "/projects/binance-cli",
    textColor: "#ff7e00",
    skills: ["Python", "Docker", "AWS"]
  },
];

const skills = ["JavaScript", "Python", "Gatsby", "Node.js", "Arduino", "ESP32", "AWS", "Terraform", "Docker"];

const ProjectsSection = () => {
  const [selectedSkills, setSelectedSkills] = useState([]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const filteredProjects = projects.filter((project) =>
    selectedSkills.every((skill) => project.skills.includes(skill))
  );

  return (
    <section id="projects" className="section">
      <h2 className="sectionTitle">Projects</h2>

      {/* Skills Section (Now part of ProjectsSection) */}
      <div className="skills-filter">
        <ul className="skillList">
          {skills.map((skill) => (
            <li
              key={skill}
              className={`skillItem ${selectedSkills.includes(skill) ? 'selected' : ''}`}
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>

      {/* Projects Section */}
      <div className="project-grid">
        {filteredProjects.length ? (
          filteredProjects.map((project, index) => (
            <ProjectCard
              key={index}
              title={project.title}
              description={project.description}
              link={project.link}
              textColor={project.textColor}
              skills={project.skills}
            />
          ))
        ) : (
          <p>No projects match the selected skills.</p>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;
