import React from "react";
import PropTypes from "prop-types";
import "./BlurryBackground.css";


const BlurryBackground = ({ opacity = 0.5, blur = 20, color = '0, 0, 0' }) => {
  return (
    <div
      className="blurry-background"
      style={{
        opacity,
        background: `rgba(${color}, 0.3)`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        transition: 'opacity 0.5s, background 0.8s',
      }}
    />
  );
};


BlurryBackground.propTypes = {
  opacity: PropTypes.number,
  blur: PropTypes.number,
  color: PropTypes.string,
};

export default BlurryBackground;
