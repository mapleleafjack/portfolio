import { Link } from 'react-router-dom';
import { ALBUMS, HARDWARE_ITEMS } from '../data';

export default function Creative() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-12">Creative</h1>

      {/* Music */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Music</h2>
        <ul className="list-none p-0 space-y-1 text-sm mb-4">
          {ALBUMS.map((album) => (
            <li key={album.title}>
              <Link to={`/creative/${album.title.toLowerCase().replace(/\s+/g, '-')}`} className="link-underline">{album.title}</Link>
              <span className="text-gray-500"> — {album.artist}, {album.tracks.length} tracks</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500">
          Also on{' '}
          <a href="https://open.spotify.com/artist/3nvxIuKGMxLkMP3CpYw4c5" target="_blank" rel="noopener noreferrer" className="link-underline">Spotify</a>
          {' · '}
          <a href="https://soundcloud.com/jackmusajo" target="_blank" rel="noopener noreferrer" className="link-underline">SoundCloud</a>
        </p>
      </section>

      {/* Performance */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Performance</h2>
        <p className="text-sm">
          LED props, fire juggling, contact work at festivals across Europe.
        </p>
        <p className="text-sm mt-2">
          <a href="https://www.instagram.com/jackmusajo" target="_blank" rel="noopener noreferrer" className="link-underline">Instagram</a>
          <span className="text-gray-500"> — videos and photos of performances</span>
        </p>
      </section>

      {/* Hardware */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Hardware</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {HARDWARE_ITEMS.join(', ')}.
        </p>
      </section>

      {/* Elsewhere */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Elsewhere</h2>
        <div className="text-sm space-y-1">
          <p><a href="https://www.slimechan.xyz/" target="_blank" rel="noopener noreferrer" className="link-underline">SlimeChan</a> <span className="text-gray-500">— LLM-powered browser game</span></p>
        </div>
      </section>
    </div>
  );
}
