import React, { useEffect, useState } from 'react';
import './scrollingText.css';

const ScrollingText = () => {
  const [currentText, setCurrentText] = useState('');
  const texts = [
    "I'm Jack, a software engineer with over a decade of experience in full-stack development.",
    "I blend creativity and technology, creating projects that combine software, audio, and visual elements.",
    "My current focus includes web animations, hardware projects using ESP32 and Arduino, and AI-powered tools."
  ];
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const text = texts[textIndex];
    
    if (charIndex === text.length + 20) { // Add delay at the end
      setCharIndex(0);
      setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
      setCurrentText('');
    } else if (charIndex < text.length) {
      const timeoutId = setTimeout(() => {
        setCurrentText(text.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => {
        setCharIndex(charIndex + 1);
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [charIndex, textIndex, texts]);

  return (
    <div className="terminal-container">
      <p className="terminal-text">
        {currentText}
        <span className="cursor">|</span>
      </p>
    </div>
  );
};

export default ScrollingText;