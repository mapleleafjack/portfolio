import React from 'react';
import { navigate } from 'gatsby';
import { useLocation } from '@reach/router';
import './mainMenu.css';

const MainMenu = () => {
  const location = useLocation();
  const path = location?.pathname || '/';
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');

  const goTo = (e, to) => {
    e.preventDefault();
    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.scrollTop = 0;
    navigate(to);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.navigate = navigate;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.navigate;
      }
    };
  }, []);

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
        <li><a href="/experience" onClick={(e) => goTo(e, '/experience')} className={normalizedPath === '/experience' ? 'active' : ''}>// Code</a></li>
        <li><a href="/creative" onClick={(e) => goTo(e, '/creative')} className={normalizedPath === '/creative' ? 'active' : ''}>// Creative</a></li>
        <li><a href="/working-style" onClick={(e) => goTo(e, '/working-style')} className={normalizedPath === '/working-style' ? 'active' : ''}>// Working Style</a></li>
        <li><a href="/contact" onClick={(e) => goTo(e, '/contact')} className={normalizedPath === '/contact' ? 'active' : ''}>// Contact</a></li>
      </ul>
    </nav>
  );
};

export default MainMenu;
