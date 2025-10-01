class ThreeAnimator {
  constructor({ animate }) {
    this.animate = animate;
    this.t = 0;
    this.lastFrameTime = performance.now() / 1000;
    this._running = false;
  }

  start() {
    this._running = true;
    this._loop();
  }

  _loop = () => {
    if (!this._running) return;
    requestAnimationFrame(this._loop);
    const now = performance.now() / 1000;
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.t += dt;
    this.animate(this.t, dt);
  };

  stop() {
    this._running = false;
  }
}

export default ThreeAnimator;
