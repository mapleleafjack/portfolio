// components/MainMenu/MainMenu.js
import React from 'react';
import './mainMenu.css';

const MainMenu = ({ setCurrentSection }) => {
  // Function to scroll to the top of the page and reset the animation
  const resetPage = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    setCurrentSection('about'); // Reset to the about section
    window.location.reload(); // Reload the page to restart animations
  };

  return (
    <nav className="main-menu">
      <div className="logo-container" onClick={resetPage}>
        <img src="/images/octopus.jpeg" alt="Logo" className="logo" />
        <span className="logo-text">
          JackMusajo<span className="blinking-cursor">|</span>
        </span>
      </div>
      <ul>
        <li><a href="#about" onClick={resetPage}>// About</a></li> {/* Add onClick to reset */}
        <li><a href="#projects" onClick={() => setCurrentSection('projects')}>// Projects</a></li>
        <li><a href="#contact" onClick={() => setCurrentSection('contact')}>// Contact</a></li>
      </ul>
    </nav>
  );
};

export default MainMenu;
