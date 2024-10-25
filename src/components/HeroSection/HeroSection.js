import React from 'react';
import './hero.css'; // Import the CSS file for styling

const HeroSection = () => (
  <div className="hero-container">
    <img src="images/image.png" alt="Hero Image" className="hero-image" />
    <div className="hero-content">
      <h1 className="hero-title">Jack Musajo</h1>
      <p className="hero-subtitle">Software Engineer & Creative Technologist</p>
      <a href="#projects" className="cta-button">View My Work</a>
    </div>
  </div>
);

export default HeroSection