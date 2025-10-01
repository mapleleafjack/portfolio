import React from 'react';
import { AnimatePresence } from 'framer-motion';
import AboutSection from '../AboutSection/AboutSection';
import ProjectsSection from '../ProjectsSection/ProjectsSection';
import ContactSection from '../ContactSection/ContactSection';
import './AnimatedRoutes.css';

const AnimatedRoutes = ({ location }) => {
  return (
    <AnimatePresence mode="wait">
      {location.pathname === '/' && <AboutSection />}
      {location.pathname === '/projects' && <ProjectsSection />}
      {location.pathname === '/contact' && <ContactSection />}
    </AnimatePresence>
  );
};

export default AnimatedRoutes;