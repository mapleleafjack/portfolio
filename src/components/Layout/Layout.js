import React from 'react';
import MainMenu from '../MainMenu/MainMenu';
import CustomCursor from '../CustomCursor/CustomCursor';
import ThreeBackground from '../ThreeBackground/ThreeBackground';
import ScrollingText from '../ScrollingText/ScrollingText';

const Layout = ({ children }) => {
  return (
    <>
      <MainMenu />
      <main className="main">
        <ThreeBackground />
        <CustomCursor />
        {children}
        <ScrollingText />
      </main>
    </>
  );
};

export default Layout;