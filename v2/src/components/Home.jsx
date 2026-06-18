import { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react';
import { ROTATING_PHRASES } from '../data';

/* ── Magnetic letter name ─────────────────────────────── */

const MAGNET_RADIUS = 60; // px, how close cursor must be
const MAX_SHIFT = 2.5;    // px, max letter displacement
const HOVER_SCALE = 1.07;  // subtle zoom when hovering the name

function MagneticName({ text }) {
  const containerRef = useRef(null);
  const charRefs = useRef([]);
  const hoveringRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX;
      const my = e.clientY;

      charRefs.current.forEach((span) => {
        if (!span) return;
        const cr = span.getBoundingClientRect();
        const cx = cr.left + cr.width / 2;
        const cy = cr.top + cr.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAGNET_RADIUS) {
          const strength = (1 - dist / MAGNET_RADIUS) * MAX_SHIFT;
          const angle = Math.atan2(dy, dx);
          span.style.transform = `translate(${-Math.cos(angle) * strength}px, ${-Math.sin(angle) * strength}px)`;
        } else if (hoveringRef.current) {
          span.style.transform = `scale(${HOVER_SCALE})`;
        }
      });
    };

    const handleEnter = () => {
      hoveringRef.current = true;
      charRefs.current.forEach((span) => {
        if (span) span.style.transform = `scale(${HOVER_SCALE})`;
      });
    };

    const handleLeave = () => {
      hoveringRef.current = false;
      charRefs.current.forEach((span) => {
        if (span) span.style.transform = '';
      });
    };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mousemove', handleMove, { passive: true });
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <span ref={containerRef} className="stagger-name inline-block cursor-default">
      {text.split('').map((char, i) => (
        <span
          key={i}
          ref={(el) => { charRefs.current[i] = el; }}
          className="stagger-char"
        >
          <span
            className="stagger-char-inner"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ── Rotating phrase (typewriter) ─────────────────────── */

const TYPE_SPEED = 50;   // ms per character typing
const DELETE_SPEED = 28; // ms per character deleting
const PAUSE_AFTER = 1800; // ms pause when phrase fully typed

function RotatingPhrase() {
  const [text, setText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = ROTATING_PHRASES[phraseIdx];

    if (!deleting && text === current) {
      // Fully typed — pause then delete
      const t = setTimeout(() => setDeleting(true), PAUSE_AFTER);
      return () => clearTimeout(t);
    }

    if (deleting && text === '') {
      // Fully deleted — next phrase
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % ROTATING_PHRASES.length);
      return;
    }

    const speed = deleting ? DELETE_SPEED : TYPE_SPEED;
    const t = setTimeout(() => {
      setText(deleting
        ? current.slice(0, text.length - 1)
        : current.slice(0, text.length + 1)
      );
    }, speed);

    return () => clearTimeout(t);
  }, [text, deleting, phraseIdx]);

  return (
    <span className="typewriter-text text-gray-500">{text}</span>
  );
}

/* ── Home ─────────────────────────────────────────────── */

function InteractionHint() {
  return (
    <p className="text-xs text-gray-400 mt-10" style={{ animation: 'hintFlash 4s ease-in-out infinite' }}>
      ✦ tap to spawn galaxies · drag &amp; scroll to explore
    </p>
  );
}

export default function Home() {
  const [navH, setNavH] = useState(0);

  useLayoutEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) setNavH(nav.getBoundingClientRect().height);
  }, []);

  return (
    <div
      className="flex flex-col justify-center"
      style={{ height: navH ? `calc(100dvh - ${navH}px)` : '100dvh' }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        {/* Logo rendered as 3D billboard sprite in ThreeBackground */}
        <div className="h-32 sm:h-44 mb-6" />
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-0.5">
          Software engineer
        </p>
        <p className="text-base sm:text-lg text-gray-400 leading-relaxed min-h-[1.6em] mb-6">
          <RotatingPhrase />
        </p>
        <div className="flex gap-4 text-sm text-gray-400">
          <a href="mailto:jack.musajo@gmail.com" className="link-underline">Email</a>
          <span className="text-gray-300">·</span>
          <a href="https://github.com/mapleleafjack" target="_blank" rel="noopener noreferrer" className="link-underline">GitHub</a>
          <span className="text-gray-300">·</span>
          <a href="https://www.linkedin.com/in/chakri-musajo-somma" target="_blank" rel="noopener noreferrer" className="link-underline">LinkedIn</a>
        </div>
        <InteractionHint />
      </div>
    </div>
  );
}
