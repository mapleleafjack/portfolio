import { useEffect, useRef } from 'react';

/*
  Ultra-subtle cursor trail — a barely-visible line
  that follows the pointer and fades quickly.
  Only active on non-touch devices.
*/

const TRAIL_LENGTH = 12;   // max trail points
const LINE_WIDTH = 1;      // px
const FADE_MS = 400;       // how fast each point fades

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const rafRef = useRef(null);
  const disabledRef = useRef(false);

  useEffect(() => {
    // Disable on touch devices
    const onTouch = () => { disabledRef.current = true; };
    window.addEventListener('touchstart', onTouch, { once: true });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let w, h;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      if (disabledRef.current) return;
      const now = performance.now();
      pointsRef.current.push({ x: e.clientX, y: e.clientY, t: now });
      // Trim old points
      while (pointsRef.current.length > TRAIL_LENGTH) {
        pointsRef.current.shift();
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pts = pointsRef.current;
      if (pts.length < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const now = performance.now();

      // Remove fully faded points
      while (pts.length > 0 && now - pts[0].t > FADE_MS) {
        pts.shift();
      }

      if (pts.length < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.beginPath();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }

      // Fade the whole stroke by opacity on the oldest segment
      const age = now - pts[0].t;
      const alpha = Math.max(0, 1 - age / FADE_MS) * 0.25; // max 25% opacity
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      window.removeEventListener('touchstart', onTouch);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-trail" />;
}
