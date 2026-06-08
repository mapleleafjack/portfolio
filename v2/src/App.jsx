import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Nav from './components/Nav';
import Home from './components/Home';
import Work from './components/Work';
import Creative from './components/Creative';
import Album from './components/Album';
import CursorTrail from './components/CursorTrail';
import ColorShift from './components/ColorShift';

function PageWrapper({ children }) {
  const location = useLocation();

  return <div key={location.pathname} className="page-enter">{children}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ColorShift />
      <CursorTrail />
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-8 sm:py-12">
        <Routes>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/work" element={<PageWrapper><Work /></PageWrapper>} />
          <Route path="/creative" element={<PageWrapper><Creative /></PageWrapper>} />
          <Route path="/creative/:slug" element={<PageWrapper><Album /></PageWrapper>} />
        </Routes>
        <footer className="status-line">
          <span className="status-dot" /> open to projects &amp; collaborations
        </footer>
      </main>
    </BrowserRouter>
  );
}
