import React, { useRef, useEffect } from 'react';
import './ScrollBox.css';
import { getNextRoute, getPrevRoute } from '../AnimatedRoutes/scrollNav';
import { navigate } from 'gatsby';

// ScrollBox: transparent background, only allow scrolling inside the box.
// If wheel event is outside the box, cycle to next route.
const ScrollBox = ({ children, height = '70vh', maxHeight = '80vh' }) => {
  const boxRef = useRef(null);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!boxRef.current) return;
      const box = boxRef.current;
      const isInside = box.contains(e.target);
      if (!isInside) {
        // Use consistent next route logic (no loop at end)
        const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
        const nextRoute = e.deltaY > 0 ? getNextRoute(currentPath) : getPrevRoute(currentPath);
        if (nextRoute !== currentPath) {
          navigate(nextRoute);
        }
      }
      // If inside, allow normal scroll (do nothing)
    };
    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      className="scroll-box"
      style={{ height, maxHeight, background: 'transparent' }}
      ref={boxRef}
    >
      {children}
    </div>
  );
};

export default ScrollBox;
