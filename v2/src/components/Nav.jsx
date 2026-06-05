import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
      <Link to="/" className="font-semibold no-underline mr-auto">Jack Musajo</Link>
      <Link to="/work">Work</Link>
      <Link to="/creative">Creative</Link>
    </nav>
  );
}
