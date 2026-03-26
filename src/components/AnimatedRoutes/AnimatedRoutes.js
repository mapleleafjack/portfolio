import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { navigate } from 'gatsby';

import AboutSection from '../AboutSection/AboutSection';
import ContactSection from '../ContactSection/ContactSection';
import HowIWorkSection from '../HowIWorkSection/HowIWorkSection';
import WorkingStyleSection from '../WorkingStyleSection/WorkingStyleSection';
import WorkHistorySection from '../WorkHistorySection/WorkHistorySection';
import CreativeSection from '../CreativeSection/CreativeSection';
import BlurryBackground from '../BlurryBackground';
import './AnimatedRoutes.css';
import { orderedRoutes, getNextRoute, getPrevRoute } from './scrollNav';


// Animation for non-index pages (slide from side)
const pageVariants = {
  initial: {
    x: -200,
  },
  enter: {
    x: 0,
  },
  exit: {
    x: 200,
  }
};

// Animation for index page (fade in from center)
const indexVariants = {
  initial: {
    scale: 0.98,
  },
  enter: {
    scale: 1,
  },
  exit: {
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
  '/working-style': 0.75,
  '/experience': 0.75,
  '/creative': 0.8,
};

const BG_COLOR_MAP = {
  '/': '10, 12, 14',
  '/how-i-work': '12, 10, 18',
  '/working-style': '12, 10, 18',
  '/experience': '10, 12, 18',
  '/creative': '18, 10, 14',
  '/contact': '10, 14, 16',
};

const THREE_BG_MAP = {
  '/': '#0a0c0e',
  '/how-i-work': '#0c0a12',
  '/working-style': '#0c0a12',
  '/experience': '#0a0c12',
  '/creative': '#120a0e',
  '/contact': '#0a0e10',
};


const EDGE_DWELL_MS = 800;
const NAV_COOLDOWN_MS = 1200;

const AnimatedRoutes = ({ location }) => {
  const path = location?.pathname || '';
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');
  const blurOpacity = BLUR_OPACITY_MAP[normalizedPath] ?? 0.5;
  const bgColor = BG_COLOR_MAP[normalizedPath] || '10, 12, 14';
  const threeBg = THREE_BG_MAP[normalizedPath] || '#0a0c0e';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('three-bg-change', { detail: { color: threeBg } }));
    }
  }, [threeBg]);

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
      case '/working-style':
        return <WorkingStyleSection />;
      case '/creative':
        return <CreativeSection />;
      case '/experience':
        return <WorkHistorySection />;
      case '/':
        return <AboutSection />;
      default:
        return <AboutSection />;
    }
  };

  const isIndex = normalizedPath === '/';
  return (
    <>
      <motion.div
        animate={{ opacity: blurOpacity }}
        transition={{ duration: 0 }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      >
        <BlurryBackground opacity={1} color={bgColor} />
      </motion.div>
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