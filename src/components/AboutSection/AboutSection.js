import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../HeroSection/HeroSection';

const AboutSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <HeroSection />
    </motion.div>
  );
};

export default AboutSection;
