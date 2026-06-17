import { Link, useLocation } from 'react-router-dom';

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <nav className="px-6 sm:px-10 pt-4 sm:pt-6 pb-4 flex items-baseline gap-x-6 text-sm">
      <Link to="/" className="font-semibold link-underline mr-auto flex items-center gap-2">
        <img src="/images/octopus_bw.png" alt="" className="w-5 h-5 opacity-70 invert" />
        Jack Musajo
      </Link>
      <Link to="/work" className={`link-underline${pathname === '/work' ? ' font-medium' : ''}`}>Work</Link>
      <Link to="/about" className={`link-underline${pathname === '/about' ? ' font-medium' : ''}`}>About</Link>
      <Link to="/creative" className={`link-underline${pathname === '/creative' ? ' font-medium' : ''}`}>Creative</Link>
    </nav>
  );
}
