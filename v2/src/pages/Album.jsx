import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ALBUMS } from '../data';

function stopAudio(audio) {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

export default function Album() {
  const { slug } = useParams();
  const album = ALBUMS.find(
    (a) => a.title.toLowerCase().replace(/\s+/g, '-') === slug
  );

  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  // Cleanup on unmount / album change
  useEffect(() => {
    return () => stopAudio(audioRef.current);
  }, [slug]);

  if (!album) {
    return (
      <div>
        <p className="text-sm text-gray-500">Album not found.</p>
        <p className="text-sm mt-2"><Link to="/creative">← Back</Link></p>
      </div>
    );
  }

  const play = (src, idx) => {
    // Clicking the currently-playing track → stop it
    if (playing === idx) {
      stopAudio(audioRef.current);
      audioRef.current = null;
      setPlaying(null);
      return;
    }

    // Stop whatever was playing before
    stopAudio(audioRef.current);

    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.onended = () => setPlaying(null);
    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
      setPlaying(null);
    });
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
                <span className="text-gray-300 mr-2 text-xs">
                  {isPlaying ? '⏸' : '▶'}
                </span>
                <span className={isPlaying ? 'font-medium' : ''}>{track.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
