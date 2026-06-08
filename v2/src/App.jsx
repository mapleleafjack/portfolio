import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Nav from './components/Nav';
import Home from './components/Home';
import Work from './components/Work';
import Creative from './components/Creative';
import Album from './components/Album';
import CursorTrail from './components/CursorTrail';

function PageWrapper({ children }) {
  const [key, setKey] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setKey(k => k + 1);
  }, [location.pathname]);

  return <div key={key} className="page-enter">{children}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <CursorTrail />
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-12">
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
