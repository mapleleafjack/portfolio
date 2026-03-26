import React from 'react';
import { motion } from 'framer-motion';
import './howIWorkSection.css';

const SECTIONS = [
  {
    title: 'The Neuroscience',
    tint: '162, 89, 230',
    intro: 'ADHD is a dopamine regulation issue. The prefrontal cortex is under-stimulated \u2014 this shapes everything.',
    items: [
      { title: 'Interest-Based Nervous System', text: 'Prioritises by interest, challenge, novelty, and urgency \u2014 not importance or deadline.' },
      { title: 'Deficient Working Memory', text: 'Mental whiteboard is smaller. Interruptions erase the entire model, not just the current line.' },
      { title: 'Time Blindness', text: 'There\u2019s \u201cnow\u201d and \u201cnot now.\u201d Scope is processable; deadlines aren\u2019t intuitive.' },
      { title: 'Emotional Dysregulation', text: 'Faster, more intense emotions. Rejection Sensitive Dysphoria means critique lands disproportionately hard.' },
    ],
  },
  {
    title: 'How This Shows Up',
    tint: '79, 107, 237',
    items: [
      { title: 'All-or-Nothing', text: 'Hyperfocus when locked in. Paralysis when not. Very little middle ground.' },
      { title: 'Stimulation Seeking', text: 'The brain constantly hunts for stimulation. Best when channelled into one rich problem.' },
      { title: 'Scope Over Time', text: 'Scoping tasks down helps more than setting timers. Best work often comes close to the wire.' },
      { title: 'Costly Context Switching', text: '20\u201325 min to re-engage after interruption. Not just focus lost \u2014 confidence too.' },
      { title: 'Reactive by Default', text: 'Planning must be externalised. Written systems are prosthetic prefrontal cortex.' },
    ],
  },
  {
    title: 'Triggers & Counters',
    tint: '230, 69, 69',
    intro: 'Patterns that spiral \u2014 and the interventions that break them.',
    items: [
      { title: 'No Context', text: 'Diving in without prep \u2192 wall \u2192 panic spiral.', counter: '5 minutes of structured questions before starting.' },
      { title: 'The Unknown', text: '\u201cI don\u2019t know anything about that\u201d \u2192 doubt cascade.', counter: 'Write down what I DO know. Two bullet points breaks the spell.' },
      { title: 'Critique', text: '\u201cYour code could be better\u201d reads as \u201cyou\u2019re not good enough.\u201d', counter: 'Never respond immediately. Read, close, return in 10 minutes.' },
      { title: 'Comfort Seeking', text: 'Scrolling, procrastinating \u2014 dopamine substitutes.', counter: '\u201cWhat am I avoiding? What\u2019s the smallest next step?\u201d' },
      { title: 'Panic Mode', text: '\u201cThis is unclear\u201d \u2192 full overwhelm in seconds.', counter: 'Breathe, water, stand. Then: \u201cWhat\u2019s actually happening?\u201d' },
    ],
  },
];

const RESETS = [
  {
    category: 'Physical Resets',
    items: [
      { title: 'Box Breathing', text: '4-4-4-4. Activates vagus nerve, lowers cortisol in 60s.' },
      { title: 'Cold Water', text: 'Dive reflex \u2014 immediate parasympathetic calming.' },
      { title: 'Movement', text: '2 min walking metabolises stress hormones.' },
      { title: 'Morning Exercise', text: 'BDNF + raised baseline dopamine for hours.' },
    ],
  },
  {
    category: 'Mental Resets',
    items: [
      { title: 'Micro Slow Downs', text: '2 min reset before switching tasks.' },
      { title: 'Anchoring', text: '3 see, 2 hear, 1 feel. Prefrontal cortex back online.' },
      { title: 'Fact vs Emotion', text: 'Two columns. The gap becomes obvious.' },
      { title: 'Gamifying', text: 'Visible completion markers. \u201cDone\u201d dopamine is real.' },
    ],
  },
  {
    category: 'Deeper Techniques',
    items: [
      { title: 'If-Then Plans', text: '\u201cWhen X, then Y\u201d \u2014 bypasses executive function.' },
      { title: 'Transition Rituals', text: 'Close tabs \u2192 stand \u2192 breathe \u2192 write next action.' },
      { title: 'Ultradian Rhythms', text: '90-min focus \u2192 15-min genuine break.' },
      { title: 'Pre-mortem', text: '\u201cIf this fails, what caused it?\u201d Anxiety \u2192 preparation.' },
    ],
  },
];

const COLLABORATE = [
  { title: 'Give Context First', text: 'What\u2019s the ask, what do I need, what\u2019s the scope. 5 min upfront prevents a spiral.' },
  { title: 'Initial Reaction \u2260 Final Answer', text: 'Hesitance is ADHD doubt, not a reasoned assessment. Give me space to process.' },
  { title: 'Frame Constructively', text: '\u201cHave you considered...\u201d not \u201cthis is wrong.\u201d Reasoning, not just correction.' },
  { title: 'Respect Flow State', text: 'If I\u2019m locked in, a message I can read later beats a tap on the shoulder.' },
  { title: 'Explicit Scope', text: '\u201c30 min max\u201d or \u201ctake your time\u201d \u2014 without it, everything feels equally overwhelming.' },
  { title: 'Written Follow-ups', text: 'My best thinking is written. Permission to come back later makes all the difference.' },
];

const ENGINEERING = {
  superpowers: [
    { title: 'Hyperfocus Debugging', text: 'The clue \u2192 hypothesis \u2192 test \u2192 result loop is perfectly calibrated for ADHD.' },
    { title: 'Pattern Recognition', text: 'Lateral connections others miss, across seemingly unrelated systems.' },
    { title: 'Crisis Performance', text: 'Production incidents finally give the urgency signal the brain needs.' },
    { title: 'Rapid Prototyping', text: 'Bias toward action. Working version faster than most.' },
  ],
  friction: [
    { title: 'Long-Running Tasks', text: 'Refactoring, migration, docs. Visible milestones + frequent commits.' },
    { title: 'On-Demand Reviews', text: 'Breaks flow. Batch into dedicated slots.' },
    { title: 'Low-Stimulus Meetings', text: 'Active note-taking to stay engaged.' },
    { title: 'Estimation', text: 'Historical data, not gut feel.' },
    { title: 'Multi-Project Switching', text: 'Single-task. Finish before starting. Written context notes.' },
  ],
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const Section = ({ title, intro, tint, children }) => (
  <motion.div
    variants={fadeUp}
    className="hiw-block"
    style={tint ? { '--tint': tint } : undefined}
  >
    <h2 className="hiw-heading">{title}</h2>
    {intro && <p className="hiw-intro">{intro}</p>}
    {children}
  </motion.div>
);

const Card = ({ title, text, counter }) => (
  <motion.div variants={fadeUp} className="hiw-card">
    <h4 className="hiw-card-title">{title}</h4>
    <p className="hiw-card-text">{text}</p>
    {counter && (
      <div className="hiw-counter">
        <span className="hiw-counter-label">Counter</span>
        <span className="hiw-counter-text">{counter}</span>
      </div>
    )}
  </motion.div>
);

const HowIWorkSection = () => (
  <motion.section
    className="hiw-section"
    initial="hidden"
    animate="visible"
    variants={stagger}
  >
    <div className="hiw-container">
      <motion.header variants={fadeUp} className="hiw-hero">
        <h1 className="hiw-title">How I Work</h1>
        <p className="hiw-subtitle">
          A playbook distilled from ADHD coaching &mdash; understanding my wiring to work with it, not against it.
        </p>
      </motion.header>

      {SECTIONS.map((section) => (
        <Section key={section.title} title={section.title} intro={section.intro} tint={section.tint}>
          <div className="hiw-grid">
            {section.items.map((item) => (
              <Card key={item.title} {...item} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="What Helps" tint="46, 204, 64">
        {RESETS.map((group) => (
          <div key={group.category} className="hiw-reset-group">
            <h3 className="hiw-subheading">{group.category}</h3>
            <div className="hiw-grid hiw-grid--sm">
              {group.items.map((item) => (
                <Card key={item.title} {...item} />
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Working With Me" intro="For colleagues, managers, and collaborators." tint="255, 152, 0">
        <div className="hiw-grid">
          {COLLABORATE.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section title="ADHD &times; Engineering" tint="0, 191, 174">
        <div className="hiw-eng-columns">
          <div className="hiw-eng-col">
            <h3 className="hiw-subheading hiw-subheading--green">Superpowers</h3>
            {ENGINEERING.superpowers.map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="hiw-eng-item">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
          <div className="hiw-eng-col">
            <h3 className="hiw-subheading hiw-subheading--muted">Friction Points</h3>
            {ENGINEERING.friction.map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="hiw-eng-item">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <motion.footer variants={fadeUp} className="hiw-footer">
        Source: ADHD coaching with Dr Jo, Pocket Psychology &mdash; January 2026
      </motion.footer>
    </div>
  </motion.section>
);

export default HowIWorkSection;
