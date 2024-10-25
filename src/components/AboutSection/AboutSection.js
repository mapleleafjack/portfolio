import React, { useState, useEffect } from 'react';  // Add useState and useEffect imports
import HeroSection from '../HeroSection/HeroSection';
import './aboutSection.css'; // Add this new CSS file for styles

const AboutSection = ({ setCurrentSection }) => {  // Accept setCurrentSection as a prop
  const [displayedText, setDisplayedText] = useState('');
  const aboutText = "I'm Jack, a software engineer with over a decade of experience in full-stack development. I blend creativity and technology, creating projects that combine software, audio, and visual elements. My current focus includes web animations, hardware projects using ESP32 and Arduino, and AI-powered tools.";
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentCharIndex < aboutText.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(aboutText.slice(0, currentCharIndex + 1));
        setCurrentCharIndex(currentCharIndex + 1);
      }, 50); // Adjust typing speed here (milliseconds)

      return () => clearTimeout(timeoutId);
    }
  }, [currentCharIndex, aboutText]);

  return (
    <>
      {/* Pass setCurrentSection prop to HeroSection */}
      <HeroSection setCurrentSection={setCurrentSection} />  
      <section id="about" className="section">
        <h2 className="sectionTitle">About Me</h2>
        <p className="terminal-text">
          {displayedText}
          <span className="cursor">|</span>
        </p>
      </section>
    </>
  );
};

export default AboutSection;
