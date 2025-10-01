import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AboutSection from '../AboutSection/AboutSection';
import ProjectsSection from '../ProjectsSection/ProjectsSection';
import ContactSection from '../ContactSection/ContactSection';
import BlurryBackground from '../BlurryBackground';
import './AnimatedRoutes.css';

const pageVariants = {
  initial: {
    opacity: 0,
    x: -200,
  },
  enter: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 200,
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

const BLUR_OPACITY_MAP = {
  '/': 0.1, // About
  '/projects': 0.7,
  '/contact': 0.8,
};

const AnimatedRoutes = ({ location }) => {

  const path = location?.pathname || '';
  // Remove trailing slash unless it's the root path
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');
  const blurOpacity = BLUR_OPACITY_MAP[normalizedPath] ?? 0.5;

  const renderComponent = () => {
    console.log('Current path:', normalizedPath); // For debugging
    switch (normalizedPath) {
      case '/projects':
        return <ProjectsSection />;
      case '/contact':
        return <ContactSection />;
      case '/':
        return <AboutSection />;
      default:
        console.log('No matching route, defaulting to About');
        return <AboutSection />;
    }
  };

  return (
    <>
      <BlurryBackground opacity={blurOpacity} />
      <AnimatePresence mode="wait">
        <motion.div
          key={location?.pathname || '/'}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="route-content"
        >
          {renderComponent()}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AnimatedRoutes;