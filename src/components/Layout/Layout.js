import React from 'react';
import MainMenu from '../MainMenu/MainMenu';
import ThreeBackground from '../ThreeBackground/ThreeBackground';
import ScrollingText from '../ScrollingText/ScrollingText';
import AudioControl from '../AudioControl/AudioControl';

const Layout = ({ children }) => {
  return (
    <>
      <MainMenu />
      <main className="main">
        <ThreeBackground />
        {children}
        <ScrollingText />
      </main>
      <AudioControl />
    </>
  );
};

export default Layout;