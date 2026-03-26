import React, { useEffect, useState } from 'react';
import './scrollingTicker.css';

const ScrollingTicker = () => {
  const [displayedText, setDisplayedText] = useState('');
  const tickerText = "I'm Jack, a software engineer with over a decade of experience in full-stack development. I blend creativity and technology, creating projects that combine software, audio, and visual elements. My current focus includes web animations, hardware projects using ESP32 and Arduino, and AI-powered tools. • Welcome to my digital portfolio • Let's build something amazing together • ";
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentCharIndex < tickerText.length) {
        setDisplayedText(tickerText.slice(0, currentCharIndex + 1));
        setCurrentCharIndex(currentCharIndex + 1);
      } else {
        // Reset and start over for continuous scrolling effect
        setDisplayedText('');
        setCurrentCharIndex(0);
      }
    }, 80); // Typing speed

    return () => clearTimeout(timeoutId);
  }, [currentCharIndex, tickerText]);

  return (
    <div className="scrolling-ticker">
      <div className="ticker-content">
        <span className="ticker-text">
          {displayedText}
          <span className="ticker-cursor">|</span>
        </span>
      </div>
    </div>
  );
};

export default ScrollingTicker;
