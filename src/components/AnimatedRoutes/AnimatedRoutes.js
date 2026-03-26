import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { navigate } from 'gatsby';

import AboutSection from '../AboutSection/AboutSection';
import ContactSection from '../ContactSection/ContactSection';
import HowIWorkSection from '../HowIWorkSection/HowIWorkSection';
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
  '/': 0.1,
  '/contact': 0.8,
  '/how-i-work': 0.75,
};

const BG_COLOR_MAP = {
  '/': '10, 12, 14',
  '/how-i-work': '12, 10, 18',
  '/contact': '10, 14, 16',
};


const EDGE_DWELL_MS = 800;
const NAV_COOLDOWN_MS = 1200;

const AnimatedRoutes = ({ location }) => {
  const path = location?.pathname || '';
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');
  const blurOpacity = BLUR_OPACITY_MAP[normalizedPath] ?? 0.5;
  const bgColor = BG_COLOR_MAP[normalizedPath] || '10, 12, 14';

  const edgeSince = useRef(null);
  const edgeDir = useRef(null);
  const lastNavTime = useRef(0);

  useEffect(() => {
    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.classList.add('main--scrollable');
    return () => { if (mainEl) mainEl.classList.remove('main--scrollable'); };
  }, []);

  useEffect(() => {
    edgeSince.current = null;
    edgeDir.current = null;

    const mainEl = document.querySelector('.main');
    if (!mainEl) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) < 3) return;
      const now = Date.now();
      if (now - lastNavTime.current < NAV_COOLDOWN_MS) return;

      const { scrollTop, scrollHeight, clientHeight } = mainEl;
      const atTop = scrollTop <= 1;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 2;
      const dir = e.deltaY > 0 ? 'down' : 'up';
      const atEdge = (dir === 'down' && atBottom) || (dir === 'up' && atTop);

      if (!atEdge || dir !== edgeDir.current) {
        edgeSince.current = atEdge ? now : null;
        edgeDir.current = atEdge ? dir : null;
        return;
      }

      if (!edgeSince.current) {
        edgeSince.current = now;
        return;
      }

      if (now - edgeSince.current >= EDGE_DWELL_MS) {
        const next = dir === 'down'
          ? getNextRoute(normalizedPath)
          : getPrevRoute(normalizedPath);
        if (next !== normalizedPath) {
          edgeSince.current = null;
          edgeDir.current = null;
          lastNavTime.current = now;
          mainEl.scrollTop = 0;
          navigate(next);
        }
      }
    };

    mainEl.addEventListener('wheel', handleWheel, { passive: true });
    return () => mainEl.removeEventListener('wheel', handleWheel);
  }, [normalizedPath]);


  const renderComponent = () => {
    switch (normalizedPath) {
      case '/contact':
        return <ContactSection />;
      case '/how-i-work':
        return <HowIWorkSection />;
      case '/':
        return <AboutSection />;
      default:
        return <AboutSection />;
    }
  };

  const isIndex = normalizedPath === '/';
  return (
    <>
      <BlurryBackground opacity={blurOpacity} color={bgColor} />
      <AnimatePresence mode="wait">
        <motion.div
          key={location?.pathname || '/'}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={isIndex ? indexVariants : pageVariants}
          transition={pageTransition}
          className="route-content"
        >
          {renderComponent()}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AnimatedRoutes;