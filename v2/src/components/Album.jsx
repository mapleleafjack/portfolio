import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ALBUMS } from '../data';

export default function Album() {
  const { slug } = useParams();
  const album = ALBUMS.find(
    (a) => a.title.toLowerCase().replace(/\s+/g, '-') === slug
  );

  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  if (!album) {
    return (
      <div>
        <p className="text-sm text-gray-500">Album not found.</p>
        <p className="text-sm mt-2"><Link to="/creative">← Back</Link></p>
      </div>
    );
  }

  const play = (src, idx) => {
    if (playing === idx) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlaying(null);
    audioRef.current = audio;
    setPlaying(idx);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-8"><Link to="/creative">← Creative</Link></p>

      <h1 className="text-2xl font-bold mb-1">{album.title}</h1>
      <p className="text-sm text-gray-600 mb-8">{album.artist}</p>

      <ol className="list-none p-0 space-y-1 text-sm">
        {album.tracks.map((track, i) => {
          const isPlaying = playing === i;
          return (
            <li key={track.title}>
              <button
                onClick={() => play(track.src, i)}
                className="text-left w-full hover:text-gray-500 cursor-pointer bg-transparent border-0 p-0 font-inherit text-inherit"
              >
                <span className="text-gray-300 mr-2 text-xs">{String(i + 1).padStart(2, '0')}</span>
                <span className={isPlaying ? 'font-medium' : ''}>{track.title}</span>
                {isPlaying && <span className="text-gray-400 ml-1">▪</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
