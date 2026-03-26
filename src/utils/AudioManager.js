class AudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.userInteracted = false;
  }

  init(src) {
    if (typeof window === 'undefined') return;
    
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    
    this.audio = new Audio(src);
    this.audio.loop = false;
    this.audio.volume = this.volume;
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });
    
    return this.audio;
  }

  play() {
    if (!this.audio || !this.userInteracted) return;
    
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Audio play prevented:', error);
      });
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  toggle() {
    if (!this.audio) return;
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  setUserInteracted() {
    this.userInteracted = true;
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      userInteracted: this.userInteracted
    };
  }
}

const audioManager = new AudioManager();

export default audioManager;
