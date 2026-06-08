import { Link, useLocation } from 'react-router-dom';

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <nav className="max-w-2xl mx-auto px-6 pt-4 sm:pt-6 pb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
      <Link to="/" className="font-semibold link-underline mr-auto">Jack Musajo</Link>
      <Link to="/work" className={`link-underline${pathname === '/work' ? ' font-medium' : ''}`}>Work</Link>
      <Link to="/creative" className={`link-underline${pathname === '/creative' ? ' font-medium' : ''}`}>Creative</Link>
    </nav>
  );
}
