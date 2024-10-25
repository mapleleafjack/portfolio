// components/ContactSection/ContactSection.js
import React from 'react';
import './contactSection.css';

const ContactSection = () => (
  <section id="contact" className="contact-section">
    <h2 className="sectionTitle">Get In Touch</h2>
    <p className="contactIntro">Feel free to reach out to me via email or connect with me on LinkedIn and GitHub.</p>
    <div className="contactDetails">
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
  </section>
);

export default ContactSection;
