import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { navigate } from 'gatsby';

import AboutSection from '../AboutSection/AboutSection';
import ProjectsSection from '../ProjectsSection/ProjectsSection';
import ContactSection from '../ContactSection/ContactSection';
import PortfolioSection from '../PortfolioSection/PortfolioSection';
import BlurryBackground from '../BlurryBackground';
import './AnimatedRoutes.css';
import { orderedRoutes, getNextRoute, getPrevRoute } from './scrollNav';


// Animation for non-index pages (slide from side)
const pageVariants = {
  initial: {
    opacity: 0,
    x: -200,
  },
  enter: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 200,
  }
};

// Animation for index page (fade in from center)
const indexVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 1,
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

const BLUR_OPACITY_MAP = {
  '/': 0.1, // About
  '/projects': 0.7,
  '/contact': 0.8,
  '/portfolio': 0.6,
};


const AnimatedRoutes = ({ location }) => {
  const path = location?.pathname || '';
  // Remove trailing slash unless it's the root path
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');
  const blurOpacity = BLUR_OPACITY_MAP[normalizedPath] ?? 0.5;

  // Debounce ref
  const scrollTimeout = useRef(null);
  const lastScrollTime = useRef(0);

  // Panel index state for PortfolioSection
  const [portfolioPanelIndex, setPortfolioPanelIndex] = React.useState(0);
  const THEMES_COUNT = 5; // Keep in sync with PortfolioSection THEMES.length

  // Track modal state from ProjectsSection
  const modalOpenRef = useRef(false);
  useEffect(() => {
    const onModalState = (e) => {
      modalOpenRef.current = !!(e.detail && e.detail.open);
    };
    window.addEventListener('project-modal-state', onModalState);
    return () => window.removeEventListener('project-modal-state', onModalState);
  }, []);

  // Scroll wheel navigation effect
  useEffect(() => {
    // Custom scroll handling for /portfolio
    if (normalizedPath !== '/portfolio') {
      // Default scroll nav for other pages
      const handleWheel = (e) => {
        if (modalOpenRef.current) return;
        const now = Date.now();
        if (now - lastScrollTime.current < 350) return;
        if (Math.abs(e.deltaY) < 2) return;
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const atTop = scrollY <= 0;
        const atBottom = scrollY + windowHeight >= docHeight - 2;
        if (e.deltaY < 0 && !atTop) return;
        if (e.deltaY > 0 && !atBottom) return;
        lastScrollTime.current = now;
        let nextPath;
        if (e.deltaY > 0) {
          nextPath = getNextRoute(normalizedPath);
        } else {
          nextPath = getPrevRoute(normalizedPath);
        }
        if (nextPath !== normalizedPath) {
          navigate(nextPath);
        }
      };
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        window.removeEventListener('wheel', handleWheel);
      };
    } else {
      // Custom scroll for /portfolio
      const handleWheel = (e) => {
        if (modalOpenRef.current) return;
        const now = Date.now();
        if (now - lastScrollTime.current < 350) return;
        if (Math.abs(e.deltaY) < 2) return;
        // Only trigger at top or bottom
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const atTop = scrollY <= 0;
        const atBottom = scrollY + windowHeight >= docHeight - 2;
        // Only allow scroll nav if at top (up) or bottom (down)
        if (e.deltaY < 0 && !atTop) return;
        if (e.deltaY > 0 && !atBottom) return;
        lastScrollTime.current = now;
        // Panel navigation logic
        if (e.deltaY > 0) {
          // Scroll down
          if (portfolioPanelIndex < THEMES_COUNT - 1) {
            setPortfolioPanelIndex(portfolioPanelIndex + 1);
          } else {
            // At last panel, go to next route
            navigate(getNextRoute('/portfolio'));
          }
        } else {
          // Scroll up
          if (portfolioPanelIndex > 0) {
            setPortfolioPanelIndex(portfolioPanelIndex - 1);
          } else {
            // At first panel, go to previous route
            navigate(getPrevRoute('/portfolio'));
          }
        }
      };
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        window.removeEventListener('wheel', handleWheel);
      };
    }
  }, [normalizedPath, portfolioPanelIndex]);


  const renderComponent = () => {
    switch (normalizedPath) {
      case '/projects':
        return <ProjectsSection />;
      case '/contact':
        return <ContactSection />;
      case '/portfolio':
        return (
          <PortfolioSection
            selectedPanelIndex={portfolioPanelIndex}
            onPanelIndexChange={setPortfolioPanelIndex}
          />
        );
      case '/':
        return <AboutSection />;
      default:
        return <AboutSection />;
    }
  };

  // Use different animation for index (About) page
  const isIndex = normalizedPath === '/';
  const isPortfolio = normalizedPath === '/portfolio';
  return (
    <>
      <BlurryBackground opacity={blurOpacity} />
      <AnimatePresence mode="wait">
        <motion.div
          key={location?.pathname || '/'}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={isIndex ? indexVariants : pageVariants}
          transition={pageTransition}
          className={`route-content${isPortfolio ? ' portfolio-route' : ''}`}
        >
          {renderComponent()}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AnimatedRoutes;