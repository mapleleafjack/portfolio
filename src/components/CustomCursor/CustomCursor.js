import React, { useEffect, useState } from 'react';
import './customCursor.css';

const CustomCursor = () => {
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(true); // Initially hidden until mouse moves
  const [pointer, setPointer] = useState(false);

  // Event listener for component loading
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleEnd = () => setLoading(false);

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleEnd);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleEnd);
    };
  }, []);

  // Cursor hiding and pointer detection
  useEffect(() => {
    const moveCursor = (e) => {
      const cursor = document.getElementById('custom-cursor');
      const cursorWidth = cursor.offsetWidth;
      const cursorHeight = cursor.offsetHeight;

      if (hidden) setHidden(false); // Show cursor after first mouse movement

      cursor.style.transform = `translate(${e.clientX - cursorWidth / 2}px, ${e.clientY - cursorHeight / 2}px)`;
    };

    const handlePointerEnter = () => setPointer(true);
    const handlePointerLeave = () => setPointer(false);

    window.addEventListener('mousemove', moveCursor); // Show and move cursor after mouse moves
    window.addEventListener('mouseenter', () => setHidden(false));
    window.addEventListener('mouseleave', () => setHidden(true)); // Re-hide on mouse leave

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseenter', () => setHidden(false));
      window.removeEventListener('mouseleave', () => setHidden(true));
    };
  }, [hidden]);

  return (
    <div
      className={`custom-cursor ${loading ? 'loading' : ''} ${hidden ? 'hidden' : ''} ${pointer ? 'pointer' : ''}`}
      id="custom-cursor"
    >
      <div className="circle">
        <div className="dot"></div>
      </div>
    </div>
  );
};

export default CustomCursor;
