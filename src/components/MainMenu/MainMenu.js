// components/MainMenu/MainMenu.js
import React from 'react';
import './mainMenu.css';

const MainMenu = ({ setCurrentSection }) => {
  // Function to scroll to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <nav className="main-menu">
      <div className="logo-container" onClick={scrollToTop}>
        <img src="/images/octopus.jpeg" alt="Logo" className="logo" />
        <span className="logo-text">
          JackMusajo<span className="blinking-cursor">|</span>
        </span>
      </div>
      <ul>
        <li><a href="#about" onClick={() => setCurrentSection('about')}>// About</a></li>
        <li><a href="#projects" onClick={() => setCurrentSection('projects')}>// Projects</a></li>
        <li><a href="#contact" onClick={() => setCurrentSection('contact')}>// Contact</a></li>
      </ul>
    </nav>
  );
};

export default MainMenu;
