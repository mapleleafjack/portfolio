import { Link } from 'react-router-dom';
import { ALBUMS, HARDWARE_ITEMS, SIDE_PROJECTS } from '../data';
import { Music, Fire, Cpu, Star } from 'pixelarticons/react';

export default function Creative() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-12">
        <Star className="text-accent" width={20} height={20} />
        <h1 className="text-2xl font-bold">Creative</h1>
      </div>

      {/* Music */}
      <section className="mb-12">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Music className="text-accent" width={12} height={12} />
          Music
        </h2>
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
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Fire className="text-accent" width={12} height={12} />
          Performance
        </h2>
        <p className="text-sm text-gray-600">
          LED props, fire juggling, contact work at festivals across Europe. Burning Mountain 2025 — first live fire spinning gig.
        </p>
        <p className="text-sm mt-2">
          <a href="https://www.instagram.com/jackmusajo" target="_blank" rel="noopener noreferrer" className="link-underline">Instagram</a>
          <span className="text-gray-500"> — videos and photos of performances</span>
        </p>
      </section>

      {/* Hardware */}
      <section className="mb-12">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Cpu className="text-accent" width={12} height={12} />
          Hardware
        </h2>
        <ul className="list-none p-0 space-y-1">
          {HARDWARE_ITEMS.map((item) => (
            <li key={item} className="text-sm text-gray-600 pl-0 sm:pl-3 border-l-2 border-transparent">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Side projects */}
      <section>
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Star className="text-accent" width={12} height={12} />
          Experiments
        </h2>
        <div className="space-y-2">
          {SIDE_PROJECTS.map((p) => (
            <div key={p.name} className="text-sm pl-0 sm:pl-3 border-l-2 border-gray-100 hover:border-accent transition-colors">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="link-underline font-medium">{p.name}</a>
              <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
