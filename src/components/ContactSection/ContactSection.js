import React from 'react';
import { motion } from 'framer-motion';
import './contactSection.css';

const ContactSection = () => (
  <motion.section
    id="contact"
    className="contact-section"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <div className="contact-container">
      <h2 className="sectionTitle">Get In Touch</h2>
      <p className="contactIntro">
        Feel free to reach out to me via email or connect with me on LinkedIn and GitHub.
      </p>
      <ul className="contactList">
        <li>
          <strong>Email: </strong> 
          <a href="mailto:jack.musajo@gmail.com" className="contactLink">jack.musajo@gmail.com</a>
        </li>
        <li>
          <strong>LinkedIn: </strong> 
          <a href="https://www.linkedin.com/in/chakri-musajo-somma" className="contactLink">linkedin.com/in/chakri-musajo-somma</a>
        </li>
        <li>
          <strong>GitHub: </strong> 
          <a href="https://github.com/mapleleafjack" className="contactLink">github.com/mapleleafjack</a>
        </li>
      </ul>
    </div>
  </motion.section>
);

export default ContactSection;
