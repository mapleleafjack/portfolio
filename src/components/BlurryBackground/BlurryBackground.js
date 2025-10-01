import React from "react";
import PropTypes from "prop-types";
import "./BlurryBackground.css";


const BlurryBackground = ({ opacity = 0.5, blur = 20 }) => {
  return (
    <div
      className="blurry-background"
      style={{
        opacity,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`
      }}
    />
  );
};


BlurryBackground.propTypes = {
  opacity: PropTypes.number,
  blur: PropTypes.number,
};

export default BlurryBackground;
