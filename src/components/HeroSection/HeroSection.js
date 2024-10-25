import React from 'react';
import './hero.css'; // Import the CSS file for styling

const HeroSection = ({ setCurrentSection }) => (
  <div className="hero-container">
    <img src="images/octopus.jpeg" alt="Octopus logo" className="hero-image" />
    <div className="hero-content">
      <h1 className="hero-title">Jack Musajo</h1>
      <p className="hero-subtitle">Software Engineer & Creative Technologist</p>
      {/* Update the onClick to switch to the 'projects' section */}
      <button onClick={() => setCurrentSection('projects')} className="cta-button">View My Work</button>
    </div>
  </div>
);

export default HeroSection;
