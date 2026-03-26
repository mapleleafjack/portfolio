class AudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.userInteracted = false;
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.frequencyData = null;
    this.fftSize = 512;
    this.trackIndex = 0;
  }

  _initAudioContext() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.audioContext.destination);
  }

  init(src) {
    if (typeof window === 'undefined') return;

    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.audio = new Audio(src);
    this.audio.loop = false;
    this.audio.volume = this.volume;
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this._connectAnalyser();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    return this.audio;
  }

  _connectAnalyser() {
    if (!this.audioContext) this._initAudioContext();
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    if (this.sourceNode) return;
    try {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
    } catch (e) {
      // already connected
    }
  }

  getFrequencyData() {
    if (!this.analyser || !this.frequencyData) {
      return { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0, raw: null, impact: 0, energy: 0 };
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    const n = this.analyser.frequencyBinCount;

    const bands = [
      { name: 'subBass', from: 0,                to: Math.floor(n * 0.04),  boost: 2.5 },
      { name: 'bass',    from: Math.floor(n*0.04), to: Math.floor(n * 0.12), boost: 2.0 },
      { name: 'lowMid',  from: Math.floor(n*0.12), to: Math.floor(n * 0.25), boost: 1.4 },
      { name: 'mid',     from: Math.floor(n*0.25), to: Math.floor(n * 0.50), boost: 1.0 },
      { name: 'highMid', from: Math.floor(n*0.50), to: Math.floor(n * 0.75), boost: 1.0 },
      { name: 'treble',  from: Math.floor(n*0.75), to: n,                    boost: 1.2 },
    ];

    const result = { raw: this.frequencyData };
    let totalEnergy = 0;
    for (const band of bands) {
      let sum = 0;
      const count = band.to - band.from;
      for (let i = band.from; i < band.to; i++) {
        sum += this.frequencyData[i];
      }
      const val = Math.min(1, (sum / (count * 255)) * band.boost);
      result[band.name] = val;
      totalEnergy += val;
    }
    result.energy = totalEnergy / bands.length;

    if (this._prevEnergy === undefined) this._prevEnergy = 0;
    if (this._smoothEnergy === undefined) this._smoothEnergy = 0;
    this._smoothEnergy += (result.energy - this._smoothEnergy) * 0.08;
    const delta = result.energy - this._smoothEnergy;
    result.impact = Math.min(1, Math.max(0, delta * 5));
    this._prevEnergy = result.energy;

    return result;
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
