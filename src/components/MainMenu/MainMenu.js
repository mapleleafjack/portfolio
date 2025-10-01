import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './mainMenu.css';

const MainMenu = () => {
  const navigate = useNavigate();

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
        <li><Link to="/">// Home</Link></li>
        <li><Link to="/projects">// Projects</Link></li>
        <li><Link to="/contact">// Contact</Link></li>
      </ul>
    </nav>
  );
};

export default MainMenu;
