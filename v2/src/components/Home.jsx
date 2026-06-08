import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROTATING_PHRASES } from '../data';
import { Cpu, Fire, Headphone, Volume, Lightbulb, PenSquare, Terminal, Cloud, Music } from 'pixelarticons/react';

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

export default function Home() {
  return (
    <div className="py-16 sm:py-24">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-14">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-5 select-none leading-none tracking-tight">
            <MagneticName text="Jack Musajo" />
          </h1>
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-0.5">
            Software engineer
          </p>
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed min-h-[1.6em]">
            <RotatingPhrase />
          </p>
        </div>
        <div className="text-sm text-gray-400 sm:text-right space-y-1 sm:pt-3">
          <p><a href="mailto:jack.musajo@gmail.com" className="link-underline">jack.musajo@gmail.com</a></p>
          <p><a href="https://github.com/mapleleafjack" target="_blank" rel="noopener noreferrer" className="link-underline">GitHub</a></p>
          <p><a href="https://www.linkedin.com/in/chakri-musajo-somma" target="_blank" rel="noopener noreferrer" className="link-underline">LinkedIn</a></p>
        </div>
      </div>

      {/* Skills */}
      <section className="mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Tech */}
          <div>
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-widest text-gray-500 mb-4">
              <Terminal className="text-accent" width={16} height={16} />
              Tech
            </h2>
            <div className="space-y-1.5">
              {[
                [Terminal, 'Python, JS/TS, C#, C++, Java'],
                [PenSquare, 'React, FastAPI, GraphQL, .NET'],
                [Cloud, 'AWS, Docker, Terraform, K8s, PostgreSQL'],
                [Cpu, 'ESP32, PCB design, SMD assembly, LEDs'],
              ].map(([Icon, text]) => (
                <div key={text} className="flex items-start gap-2 text-sm text-gray-600">
                  <Icon className="shrink-0 text-accent mt-0.5" width={16} height={16} />
                  <span className="leading-snug">{text}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              <Link to="/work" className="link-underline">Full projects →</Link>
            </p>
          </div>

          {/* Creative */}
          <div>
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-widest text-gray-500 mb-4">
              <Music className="text-accent" width={16} height={16} />
              Creative
            </h2>
            <div className="space-y-1.5">
              {[
                [Volume, 'Audio engineering, psytrance production'],
                [Headphone, 'Ableton Live, music composition'],
                [Fire, 'Fire spinning, flow arts, LED props'],
                [Lightbulb, 'Installations, reactive lighting, AV systems'],
              ].map(([Icon, text]) => (
                <div key={text} className="flex items-start gap-2 text-sm text-gray-600">
                  <Icon className="shrink-0 text-accent mt-0.5" width={16} height={16} />
                  <span className="leading-snug">{text}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              <Link to="/creative" className="link-underline">Music &amp; hardware →</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
