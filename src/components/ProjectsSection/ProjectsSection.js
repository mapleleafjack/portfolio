import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard/ProjectCard';
import ProjectModal from './ProjectCard/projectModal';
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




const ProjectsSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProject, setModalProject] = useState(null);

  const handleCardClick = (project) => {
    setModalProject(project);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalProject(null);
  };

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
          className="project-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <ProjectCard
                title={project.title}
                description={project.description}
                link={project.link}
                textColor={project.textColor}
                skills={project.skills}
                image={project.image}
                onClick={() => handleCardClick(project)}
              />
            </motion.div>
          ))}
        </motion.div>

        {modalOpen && (
          <ProjectModal project={modalProject} onClose={handleModalClose} />
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProjectsSection;
