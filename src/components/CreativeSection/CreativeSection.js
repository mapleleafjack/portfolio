import React from 'react';
import { motion } from 'framer-motion';
import './creativeSection.css';

const PERFORMANCE_ITEMS = [
  { title: 'LED Performance', text: 'Custom-built LED props performed at festivals across Europe — merging flow arts with technology I design and build myself.' },
  { title: 'Fire Juggling', text: 'Fire performance at festivals and events — poi, staff, and contact work.' },
  { title: 'Contact Juggling', text: 'Acrylic and stage ball manipulation — blending flow arts with interactive technology.' },
];

const HARDWARE_ITEMS = [
  { title: 'EsPoi', text: 'Custom ESP32-based LED poi with full PCB design — BQ24074 power management, schematic review process, designed for home SMD assembly.' },
  { title: 'Reactive Bus Installation', text: 'People-tracking AV system across 4 zones — PIR sensors, addressable LEDs, generative audio, Raspberry Pi + Arduino.' },
  { title: 'BMO', text: 'ESP32 companion robot with OLED display — custom GPIO mapping, inspired by Adventure Time.', github: 'https://github.com/mapleleafjack/BMO' },
  { title: 'ESP Visualiser', text: 'Audio-reactive LED visualiser — real-time frequency analysis driving addressable LED patterns.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const Section = ({ title, tint, children }) => (
  <motion.div
    variants={fadeUp}
    className="cr-block"
    style={tint ? { '--tint': tint } : undefined}
  >
    <h2 className="cr-heading">{title}</h2>
    {children}
  </motion.div>
);

const Card = ({ title, text, github }) => (
  <motion.div variants={fadeUp} className="cr-card">
    <h4 className="cr-card-title">{title}</h4>
    <p className="cr-card-text">{text}</p>
    {github && (
      <a href={github} target="_blank" rel="noopener noreferrer" className="cr-card-link">
        GitHub &rarr;
      </a>
    )}
  </motion.div>
);

const CreativeSection = () => (
  <motion.section
    className="cr-section"
    initial="hidden"
    animate="visible"
    variants={stagger}
  >
    <div className="cr-container">
      <motion.header variants={fadeUp} className="cr-hero">
        <h1 className="cr-title">Creative</h1>
        <p className="cr-subtitle">
          Music, performance, installations &mdash; where code meets art.
        </p>
      </motion.header>

      <Section title="Music" tint="230, 69, 69">
        <div className="cr-music-split">
          <motion.div variants={fadeUp} className="cr-music-col cr-music-col--sc">
            <a
              href="https://soundcloud.com/jackmusajo"
              target="_blank"
              rel="noopener noreferrer"
              className="cr-col-header"
              style={{ '--platform': '255, 85, 0' }}
            >
              <img src="https://www.google.com/s2/favicons?domain=soundcloud.com&sz=128" alt="SoundCloud" className="cr-platform-icon" />
              <div>
                <span className="cr-platform-name">SoundCloud</span>
                <span className="cr-platform-handle">@jackmusajo</span>
              </div>
            </a>
            <div className="cr-col-body">
              <h3 className="cr-highlight-title">OctoBits and Pieces</h3>
              <iframe
                width="100%"
                height="600"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/jackmusajo/sets/jacks-bitmasking-tunes&color=%23e64545&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true"
                title="OctoBits and Pieces"
                className="cr-soundcloud-embed"
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="cr-music-col cr-music-col--sp">
            <a
              href="https://open.spotify.com/artist/3nvxIuKGMxLkMP3CpYw4c5"
              target="_blank"
              rel="noopener noreferrer"
              className="cr-col-header"
              style={{ '--platform': '30, 215, 96' }}
            >
              <img src="https://www.google.com/s2/favicons?domain=spotify.com&sz=128" alt="Spotify" className="cr-platform-icon" />
              <div>
                <span className="cr-platform-name">Spotify</span>
                <span className="cr-platform-handle">Artist Profile</span>
              </div>
            </a>
            <div className="cr-col-body">
              <iframe
                src="https://open.spotify.com/embed/album/5fJ7LN7uyS4PpMt3faQ3kq?utm_source=generator&theme=0"
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Bob Warley and the Haters"
                className="cr-spotify-embed"
              />
              <iframe
                src="https://open.spotify.com/embed/album/5zmKIW3votUDFlXDNvt19c?utm_source=generator&theme=0"
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="The Cloud"
                className="cr-spotify-embed"
              />
            </div>
          </motion.div>
        </div>
      </Section>

      <Section title="Performance" tint="255, 152, 0">
        <p className="cr-section-intro">
          LED performer and flow artist &mdash; fire juggling, LED props, and contact work at festivals and events across Europe.
        </p>
        <div className="cr-grid">
          {PERFORMANCE_ITEMS.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
        <motion.div variants={fadeUp} className="cr-placeholder">
          Photos and videos coming soon.
        </motion.div>
      </Section>

      <Section title="Hardware &amp; Installations" tint="0, 191, 174">
        <div className="cr-grid">
          {HARDWARE_ITEMS.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section title="Games" tint="120, 200, 80">
        <p className="cr-section-intro">
          SlimeChan &mdash; a browser game built and deployed as a side project.
        </p>
        <motion.div variants={fadeUp} className="cr-game-embed">
          <iframe
            src="http://slimechan.xyz"
            width="100%"
            height="600"
            frameBorder="0"
            title="SlimeChan"
            className="cr-game-iframe"
            allow="fullscreen"
          />
        </motion.div>
      </Section>
    </div>
  </motion.section>
);

export default CreativeSection;
