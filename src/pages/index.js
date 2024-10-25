import React, { useState } from 'react';
import MainMenu from '../components/MainMenu/MainMenu';
import AboutSection from '../components/AboutSection/AboutSection';
import ProjectsSection from '../components/ProjectsSection/ProjectsSection';
import ContactSection from '../components/ContactSection/ContactSection';
import CustomCursor from '../components/CustomCursor/CustomCursor';  // Import the new custom cursor
import './index.css';

const IndexPage = () => {
  const [currentSection, setCurrentSection] = useState('about');

  const renderSection = () => {
    switch (currentSection) {
      case 'about':
        return <AboutSection setCurrentSection={setCurrentSection} />;
      case 'projects':
        return <ProjectsSection />;
      case 'contact':
        return <ContactSection />;
      default:
        return <AboutSection setCurrentSection={setCurrentSection} />;
    }
  };

  return (
    <main className="main">
      <CustomCursor />  {/* Add the custom cursor */}
      <MainMenu setCurrentSection={setCurrentSection} />
      {renderSection()}
    </main>
  );
};

export default IndexPage;