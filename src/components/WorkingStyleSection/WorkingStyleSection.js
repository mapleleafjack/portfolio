import React from 'react';
import { motion } from 'framer-motion';
import './workingStyleSection.css';

const PRINCIPLES = [
  {
    title: 'Deep Work Over Busy Work',
    text: 'I do my best thinking in long, uninterrupted blocks. I protect focus time and batch context switches deliberately.',
  },
  {
    title: 'Written Over Verbal',
    text: 'My clearest thinking is written. I prefer async communication — it gives space for considered responses.',
  },
  {
    title: 'Context Before Action',
    text: 'Give me the "what" and "why" upfront and I\'ll move fast. Without context, I spiral into assumptions.',
  },
  {
    title: 'Scope Over Deadlines',
    text: 'I work best when I understand the boundaries of a task. "Do X within Y" beats open-ended ambiguity.',
  },
  {
    title: 'Build to Ship',
    text: 'Bias toward action. Working version first, refinement second. I\'d rather show something real than present a plan.',
  },
  {
    title: 'Feedback as Dialogue',
    text: '"Have you considered…" lands better than "this is wrong." Reasoning helps me learn; correction alone doesn\'t.',
  },
];

const STRENGTHS = [
  { title: 'Debugging & Investigation', text: 'I thrive on the clue → hypothesis → test → result loop. Production incidents and tricky bugs energise me.' },
  { title: 'Pattern Recognition', text: 'I naturally spot connections across seemingly unrelated systems. Useful for architecture and root cause analysis.' },
  { title: 'Rapid Prototyping', text: 'I default to building. A working prototype surfaces problems faster than a spec ever will.' },
  { title: 'Documentation & Knowledge', text: 'I obsessively document systems, decisions, and runbooks — because future-me will forget everything.' },
];

const COLLABORATION = [
  { title: 'Respect Flow State', text: 'If I\'m locked in, an async message beats a tap on the shoulder. I\'ll get to it.' },
  { title: 'Explicit Scope', text: '"30 minutes max" or "take your time" — either works. Without it, everything feels equally urgent.' },
  { title: 'Written Follow-ups', text: 'After meetings, I prefer written summaries. It\'s how I process and retain decisions.' },
  { title: 'Constructive Framing', text: 'I respond best to collaborative critique. Walk me through the reasoning, not just the verdict.' },
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
    className="ws-block"
    style={tint ? { '--tint': tint } : undefined}
  >
    <h2 className="ws-heading">{title}</h2>
    {children}
  </motion.div>
);

const Card = ({ title, text }) => (
  <motion.div variants={fadeUp} className="ws-card">
    <h4 className="ws-card-title">{title}</h4>
    <p className="ws-card-text">{text}</p>
  </motion.div>
);

const WorkingStyleSection = () => (
  <motion.section
    className="ws-section"
    initial="hidden"
    animate="visible"
    variants={stagger}
  >
    <div className="ws-container">
      <motion.header variants={fadeUp} className="ws-hero">
        <h1 className="ws-title">Working Style</h1>
        <p className="ws-subtitle">
          How I like to work, collaborate, and deliver my best.
        </p>
      </motion.header>

      <Section title="Principles" tint="79, 107, 237">
        <div className="ws-grid">
          {PRINCIPLES.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section title="Where I Shine" tint="46, 204, 64">
        <div className="ws-grid">
          {STRENGTHS.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section title="Working With Me" tint="255, 152, 0">
        <div className="ws-grid">
          {COLLABORATION.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
      </Section>
    </div>
  </motion.section>
);

export default WorkingStyleSection;
