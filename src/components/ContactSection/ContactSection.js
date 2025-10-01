import React from 'react';
import { motion } from 'framer-motion';
import './contactSection.css';

const ContactSection = () => (
  <motion.section
    id="contact"
    className="contact-section"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
  >
    <motion.h2 
      className="sectionTitle"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      Get In Touch
    </motion.h2>
    <motion.p 
      className="contactIntro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Feel free to reach out to me via email or connect with me on LinkedIn and GitHub.
    </motion.p>
    <motion.div 
      className="contactDetails"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <ul className="contactList">
        <motion.li
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <strong>Email: </strong> 
          <a href="mailto:jack.musajo@gmail.com" className="contactLink">jack.musajo@gmail.com</a>
        </motion.li>
        <motion.li
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <strong>LinkedIn: </strong> 
          <a href="https://www.linkedin.com/in/chakri-musajo-somma" className="contactLink">linkedin.com/in/chakri-musajo-somma</a>
        </motion.li>
        <motion.li
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <strong>GitHub: </strong> 
          <a href="https://github.com/mapleleafjack" className="contactLink">github.com/mapleleafjack</a>
        </motion.li>
      </ul>
    </motion.div>
  </motion.section>
);

export default ContactSection;
