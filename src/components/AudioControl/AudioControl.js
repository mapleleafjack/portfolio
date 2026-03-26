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
];

const AudioControl = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [trackIndex, setTrackIndex] = useState(0);
  const [trackTitle, setTrackTitle] = useState(TRACKS[0].title);

  const loadTrack = useCallback((index) => {
    const wasPlaying = audioManager.getState().isPlaying;
    if (audioManager.audio) {
      audioManager.pause();
    }
    audioManager.init(TRACKS[index].src);
    setTrackIndex(index);
    setTrackTitle(TRACKS[index].title);
    if (wasPlaying) {
      audioManager.play();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    audioManager.setUserInteracted();
    audioManager.init(TRACKS[0].src);
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
        <button className="audio-nav-btn" onClick={handleNext} aria-label="Next track">⏭</button>
      </div>
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
