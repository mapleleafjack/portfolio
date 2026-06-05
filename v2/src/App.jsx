import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './components/Home';
import Work from './components/Work';
import Creative from './components/Creative';
import Album from './components/Album';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/creative" element={<Creative />} />
          <Route path="/creative/:slug" element={<Album />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
