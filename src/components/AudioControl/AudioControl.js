import React, { useState, useEffect, useCallback } from 'react';
import audioManager from '../../utils/AudioManager';
import './audioControl.css';

const TRACKS = [
  { src: '/music/TheCloud/Jack Sonagli - The Cloud - 01 Digesting the Forbidden Fruit.mp3', title: 'Digesting the Forbidden Fruit' },
  { src: '/music/TheCloud/Jack Sonagli - The Cloud - 02 Tunnel Vision.mp3', title: 'Tunnel Vision' },
  { src: encodeURI('/music/TheCloud/Jack Sonagli - The Cloud - 03 r̴̂͜i̴̗̊t̶̮͈́͠u̶̞̓͒a̶̳͖͝l̸͍͎̃ (ft Psyranga).mp3'), title: 'r̴̂͜i̴̗̊t̶̮͈́͠u̶̞̓͒a̶̳͖͝l̸͍͎̃' },
  { src: '/music/TheCloud/Jack Sonagli - The Cloud - 04 Reaching the Peak.mp3', title: 'Reaching the Peak' },
  { src: '/music/TheCloud/Jack Sonagli - The Cloud - 05 Sea of Clouds.mp3', title: 'Sea of Clouds' },
  { src: encodeURI('/music/TheCloud/Jack Sonagli - The Cloud - 06 Jack Sonagli (ft The Bad Fucoz & mr M.D.).mp3'), title: 'Jack Sonagli' },
  { src: '/music/Remixed/Jack Sonagli - Remixed - 01 Anti-Bob RMX.mp3', title: 'Anti-Bob RMX' },
  { src: encodeURI('/music/Remixed/Jack Sonagli - Remixed - 02 Guerra & Odio RMX.mp3'), title: 'Guerra & Odio RMX' },
  { src: '/music/Remixed/Jack Sonagli - Remixed - 03 Tumorasta RMX.mp3', title: 'Tumorasta RMX' },
  { src: '/music/Remixed/Jack Sonagli - Remixed - 04 Papi Poliziotto RMX.mp3', title: 'Papi Poliziotto RMX' },
  { src: '/music/Remixed/Jack Sonagli - Remixed - 05 Bob Warley Iz My Friend RMX.mp3', title: 'Bob Warley Iz My Friend RMX' },
  { src: encodeURI('/music/OctoBits and Pieces/bipolar-daydreams.mp3'), title: 'Bipolar Daydreams' },
  { src: encodeURI('/music/OctoBits and Pieces/fungal-solutions.mp3'), title: 'Fungal Solutions' },
  { src: encodeURI('/music/OctoBits and Pieces/il-signore-e-la-mia-salvezza.mp3'), title: 'Il Signore e la Mia Salvezza' },
  { src: encodeURI('/music/OctoBits and Pieces/knight-of-the-round.mp3'), title: 'Knight of the Round' },
  { src: encodeURI('/music/OctoBits and Pieces/seaside-tentacles-jam.mp3'), title: 'Seaside Tentacles Jam' },
  { src: encodeURI('/music/OctoBits and Pieces/the-end.mp3'), title: 'The End' },
  { src: encodeURI('/music/OctoBits and Pieces/tres-fucoz-y-un-poncho.mp3'), title: 'Tres Fucoz y un Poncho' },
  { src: encodeURI('/music/OctoBits and Pieces/waltz-with-the-monster.mp3'), title: 'Waltz with the Monster' },
  { src: encodeURI('/music/OctoBits and Pieces/watch-me-now.mp3'), title: 'Watch Me Now' },
];

const AudioControl = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [trackIndex, setTrackIndex] = useState(0);
  const [trackTitle, setTrackTitle] = useState('');
  const [presetName, setPresetName] = useState('Radial');

  const loadTrack = useCallback((index) => {
    const wasPlaying = audioManager.getState().isPlaying;
    if (audioManager.audio) {
      audioManager.pause();
    }
    audioManager.init(TRACKS[index].src);
    audioManager.trackIndex = index;
    setTrackIndex(index);
    setTrackTitle(TRACKS[index].title);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('track-change', { detail: { trackIndex: index } }));
    }
    if (wasPlaying) {
      audioManager.play();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('stop-playback'));
  }, []);

  useEffect(() => {
    if (!audioManager.audio) return;

    const handleEnded = () => {
      const nextIndex = (trackIndex + 1) % TRACKS.length;
      loadTrack(nextIndex);
      audioManager.play();
    };

    audioManager.audio.addEventListener('ended', handleEnded);
    return () => {
      if (audioManager.audio) {
        audioManager.audio.removeEventListener('ended', handleEnded);
      }
    };
  }, [trackIndex, loadTrack]);

  const handleToggle = () => {
    audioManager.setUserInteracted();
    audioManager.toggle();
    setTimeout(() => {
      setIsPlaying(audioManager.getState().isPlaying);
    }, 100);
  };

  const handleNext = () => {
    const nextIndex = (trackIndex + 1) % TRACKS.length;
    loadTrack(nextIndex);
    if (isPlaying) audioManager.play();
  };

  const handlePrev = () => {
    const prevIndex = (trackIndex - 1 + TRACKS.length) % TRACKS.length;
    loadTrack(prevIndex);
    if (isPlaying) audioManager.play();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  const handleStop = () => {
    if (audioManager.audio) {
      audioManager.pause();
      audioManager.audio.currentTime = 0;
    }
    setIsPlaying(false);
    setTrackTitle('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stop-playback'));
    }
  };

  const handleCyclePreset = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cycle-preset'));
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggle();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleStop();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, trackIndex]);

  useEffect(() => {
    const onPresetChanged = (e) => {
      if (e.detail && e.detail.name) setPresetName(e.detail.name);
    };
    window.addEventListener('preset-changed', onPresetChanged);
    return () => window.removeEventListener('preset-changed', onPresetChanged);
  }, []);

  useEffect(() => {
    const onSongCubeClick = (e) => {
      if (e.detail && typeof e.detail.trackIndex === 'number') {
        const idx = e.detail.trackIndex;
        loadTrack(idx);
        audioManager.setUserInteracted();
        audioManager.play();
        setIsPlaying(true);
      }
    };
    window.addEventListener('song-cube-click', onSongCubeClick);
    return () => window.removeEventListener('song-cube-click', onSongCubeClick);
  }, [loadTrack]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioManager.audio) {
        setIsPlaying(!audioManager.audio.paused);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="audio-control">
      <span className="track-title">{trackTitle}</span>
      <div className="audio-buttons">
        <button className="audio-nav-btn" onClick={handlePrev} aria-label="Previous track">⏮</button>
        <button className="audio-toggle" onClick={handleToggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="audio-nav-btn" onClick={handleStop} aria-label="Stop">⏹</button>
        <button className="audio-nav-btn" onClick={handleNext} aria-label="Next track">⏭</button>
      </div>
      <button className="preset-btn" onClick={handleCyclePreset} aria-label="Cycle visual preset">
        {presetName}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="volume-slider"
        aria-label="Volume"
      />
    </div>
  );
};

export default AudioControl;
