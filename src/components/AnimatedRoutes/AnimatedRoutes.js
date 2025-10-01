import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AboutSection from '../AboutSection/AboutSection';
import ProjectsSection from '../ProjectsSection/ProjectsSection';
import ContactSection from '../ContactSection/ContactSection';
import './AnimatedRoutes.css';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AboutSection />} />
        <Route path="/projects" element={<ProjectsSection />} />
        <Route path="/contact" element={<ContactSection />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;