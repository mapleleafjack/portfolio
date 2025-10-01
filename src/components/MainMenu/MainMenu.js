import React from 'react';
import { Link, navigate } from 'gatsby';
import { useLocation } from '@reach/router';
import './mainMenu.css';

const MainMenu = () => {
  const location = useLocation();
  const path = location?.pathname || '/';
  // Remove trailing slash unless root
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');

  const resetPage = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    navigate('/');
  };

  return (
    <nav className="main-menu">
      <div className="logo-container" onClick={resetPage}>
        <img src="/images/octopus_bw.png" alt="Logo" className="logo" />
        <span className="logo-text">
          JackMusajo<span className="blinking-cursor">|</span>
        </span>
      </div>
      <ul>
        <li><Link to="/" className={normalizedPath === '/' ? 'active' : ''}>// Home</Link></li>
        <li><Link to="/projects" className={normalizedPath === '/projects' ? 'active' : ''}>// Projects</Link></li>
        <li><Link to="/contact" className={normalizedPath === '/contact' ? 'active' : ''}>// Contact</Link></li>
      </ul>
    </nav>
  );
};

export default MainMenu;
