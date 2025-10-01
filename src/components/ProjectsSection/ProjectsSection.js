import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      className="projects-overlay"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="projects-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.h2 
          className="sectionTitle"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Projects
        </motion.h2>

        <motion.div 
          className="skills-filter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ul className="skillList">
            {skills.map((skill, index) => (
              <motion.li
                key={skill}
                className={`skillItem ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                onClick={() => toggleSkill(skill)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                {skill}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          className="project-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {filteredProjects.length ? (
            filteredProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <ProjectCard
                  title={project.title}
                  description={project.description}
                  link={project.link}
                  textColor={project.textColor}
                  skills={project.skills}
                />
              </motion.div>
            ))
          ) : (
            <motion.p 
              className="no-projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              No projects match the selected skills.
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectsSection;
