import React from 'react';
import { navigate } from 'gatsby';
import { useLocation } from '@reach/router';
import './mainMenu.css';

const MainMenu = () => {
  const location = useLocation();
  const path = location?.pathname || '/';
  // Remove trailing slash unless root
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');

  const goTo = (e, to) => {
    e.preventDefault();
    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.scrollTop = 0;
    navigate(to);
  };

  return (
    <nav className="main-menu">
      <div className="logo-container" onClick={(e) => goTo(e, '/')}>
        <img src="/images/octopus_bw.png" alt="Logo" className="logo" />
        <span className="logo-text">
          JackMusajo<span className="blinking-cursor">|</span>
        </span>
      </div>
      <ul>
        <li><a href="/" onClick={(e) => goTo(e, '/')} className={normalizedPath === '/' ? 'active' : ''}>// Home</a></li>
        <li><a href="/how-i-work" onClick={(e) => goTo(e, '/how-i-work')} className={normalizedPath === '/how-i-work' ? 'active' : ''}>// How I Work</a></li>
        <li><a href="/contact" onClick={(e) => goTo(e, '/contact')} className={normalizedPath === '/contact' ? 'active' : ''}>// Contact</a></li>
      </ul>
    </nav>
  );
};

export default MainMenu;
