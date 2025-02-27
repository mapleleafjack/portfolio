import React from 'react';
import './hero.css'; // Import the CSS file for styling

const HeroSection = ({ setCurrentSection }) => (
  <div className="hero-container">
    <img src="images/octopus_bw.png" alt="Octopus logo" className="hero-image" />
    <div className="hero-content">
      <h1 className="hero-title">JACK MUSAJO</h1>
      <p className="hero-subtitle">Software Engineer & Creative Technologist</p>
      {/* <button onClick={() => setCurrentSection('projects')} className="cta-button">View My Work</button> */}
    </div>
  </div>
);

export default HeroSection;
