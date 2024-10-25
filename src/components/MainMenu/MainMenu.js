import React from 'react';
import './mainMenu.css';

const MainMenu = ({ setCurrentSection }) => (
  <nav className="main-menu">
    <ul>
      <li><a href="#about" onClick={() => setCurrentSection('about')}>About</a></li>
      <li><a href="#projects" onClick={() => setCurrentSection('projects')}>Projects</a></li>
      <li><a href="#contact" onClick={() => setCurrentSection('contact')}>Contact</a></li>
    </ul>
  </nav>
);

export default MainMenu;
