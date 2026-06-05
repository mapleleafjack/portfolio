const brandLogo = (domain) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const BRANDS = [
  { name: 'BlackRock', url: 'https://www.blackrock.com/', logo: brandLogo('blackrock.com') },
  { name: 'Made Tech', url: 'https://www.madetech.com/', logo: brandLogo('madetech.com') },
  { name: 'Sano Genetics', url: 'https://www.sanogenetics.com/', logo: brandLogo('sanogenetics.com') },
  { name: 'Engage Hub', url: 'https://www.engagehub.com/', logo: brandLogo('engagehub.com') },
  { name: 'Sixs', url: 'https://sixs.it/', logo: brandLogo('sixs.it') },
  { name: 'Gov.UK', url: 'https://www.gov.uk/', logo: brandLogo('gov.uk') },
  { name: 'Hackney Council', url: 'https://hackney.gov.uk/', logo: brandLogo('hackney.gov.uk') },
  { name: 'Camden Council', url: 'https://www.camden.gov.uk/', logo: brandLogo('camden.gov.uk') },
  { name: 'Bank of Ireland', url: 'https://www.bankofireland.com/', logo: brandLogo('bankofireland.com') },
  { name: 'Hermes / Evri', url: 'https://www.evri.com/', logo: brandLogo('evri.com') },
];

export const KEY_PROJECTS = [
  {
    company: 'BlackRock',
    projects: [
      { name: 'LPA Extractor', tech: ['Python', 'LLM', 'RAG'], description: 'AI-powered legal document extraction', impact: '6h → 1h per document' },
      { name: 'Term Intelligence', tech: ['React', 'Python', 'GraphQL'], description: 'Fund term analysis product replacing PowerBI prototype' },
      { name: 'AI Dev Workflows', tech: ['Node.js', 'AI/LLM'], description: 'Reusable AI workflows for Jira, Bitbucket, Confluence' },
    ],
  },
  {
    company: 'Made Tech',
    projects: [
      { name: 'Housing Repairs SaaS', tech: ['React', 'Ruby on Rails', 'GOV.UK'], description: 'First SaaS product for local councils' },
      { name: 'Hackney Social Care', tech: ['React', '.NET', 'PostgreSQL'], description: 'Rebuilt critical public service after cyberattack' },
    ],
  },
  {
    company: 'Engage Hub',
    projects: [
      { name: 'Dragon Platform', tech: ['React', '.NET', 'SQL Server'], description: 'Enterprise comms automation for Bank of Ireland, Hermes, and others' },
    ],
  },
  {
    company: 'Sano Genetics',
    projects: [
      { name: 'Bio Pipeline Automation', tech: ['Python', 'AWS', 'NextFlow'], description: 'Automated cloud workflows for bioengineering research' },
    ],
  },
  {
    company: 'Sixs',
    projects: [
      { name: 'Social Care System', tech: ['C#', '.NET', 'SQL Server'], description: 'Full management system for social care cooperatives' },
    ],
  },
];

export const SKILLS = {
  Languages: ['Python', 'JavaScript / TypeScript', 'C#', 'C++', 'Java'],
  Frameworks: ['React', 'FastAPI', 'GraphQL (Strawberry)', '.NET'],
  Infrastructure: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'PostgreSQL', 'NextFlow'],
  Practices: ['Clean Architecture', 'RESTful APIs', 'CI/CD', 'Code Reviews', 'GitHub / Bitbucket'],
  Other: ['Arduino / ESP32', 'Android', 'Linux'],
};

export const SIDE_PROJECTS = [
  {
    name: 'SlimeChan',
    url: 'https://www.slimechan.xyz/',
    github: 'https://github.com/mapleleafjack/slime-chan',
    description: 'LLM-powered interactive slime colony — each slime has its own personality and responds to conversation',
  },
  {
    name: 'Glypho',
    url: 'https://www.glypho.xyz/',
    description: 'Creative web experiment exploring generative art and typography',
  },
];

export const ALBUMS = [
  {
    title: 'The Cloud',
    artist: 'Jack Sonagli',
    tracks: [
      { title: 'Digesting the Forbidden Fruit', src: '/music/TheCloud/Jack Sonagli - The Cloud - 01 Digesting the Forbidden Fruit.mp3' },
      { title: 'Tunnel Vision', src: '/music/TheCloud/Jack Sonagli - The Cloud - 02 Tunnel Vision.mp3' },
      { title: 'r̴̂͜i̴̗̊t̶̮͈́͠u̶̞̓͒a̶̳͖͝l̸͍͎̃', src: encodeURI('/music/TheCloud/Jack Sonagli - The Cloud - 03 r̴̂͜i̴̗̊t̶̮͈́͠u̶̞̓͒a̶̳͖͝l̸͍͎̃ (ft Psyranga).mp3') },
      { title: 'Reaching the Peak', src: '/music/TheCloud/Jack Sonagli - The Cloud - 04 Reaching the Peak.mp3' },
      { title: 'Sea of Clouds', src: '/music/TheCloud/Jack Sonagli - The Cloud - 05 Sea of Clouds.mp3' },
      { title: 'Jack Sonagli', src: encodeURI('/music/TheCloud/Jack Sonagli - The Cloud - 06 Jack Sonagli (ft The Bad Fucoz & mr M.D.).mp3') },
    ],
  },
  {
    title: 'Remixed',
    artist: 'Bob Warley and the Haters',
    tracks: [
      { title: 'Anti-Bob RMX', src: '/music/Remixed/Jack Sonagli - Remixed - 01 Anti-Bob RMX.mp3' },
      { title: 'Guerra & Odio RMX', src: encodeURI('/music/Remixed/Jack Sonagli - Remixed - 02 Guerra & Odio RMX.mp3') },
      { title: 'Tumorasta RMX', src: '/music/Remixed/Jack Sonagli - Remixed - 03 Tumorasta RMX.mp3' },
      { title: 'Papi Poliziotto RMX', src: '/music/Remixed/Jack Sonagli - Remixed - 04 Papi Poliziotto RMX.mp3' },
      { title: 'Bob Warley Iz My Friend RMX', src: '/music/Remixed/Jack Sonagli - Remixed - 05 Bob Warley Iz My Friend RMX.mp3' },
    ],
  },
  {
    title: 'OctoBits and Pieces',
    artist: 'Jack Sonagli',
    tracks: [
      { title: 'Bipolar Daydreams', src: encodeURI('/music/OctoBits and Pieces/bipolar-daydreams.mp3') },
      { title: 'Fungal Solutions', src: encodeURI('/music/OctoBits and Pieces/fungal-solutions.mp3') },
      { title: 'Il Signore e la Mia Salvezza', src: encodeURI('/music/OctoBits and Pieces/il-signore-e-la-mia-salvezza.mp3') },
      { title: 'Knight of the Round', src: encodeURI('/music/OctoBits and Pieces/knight-of-the-round.mp3') },
      { title: 'Seaside Tentacles Jam', src: encodeURI('/music/OctoBits and Pieces/seaside-tentacles-jam.mp3') },
      { title: 'The End', src: encodeURI('/music/OctoBits and Pieces/the-end.mp3') },
      { title: 'Tres Fucoz y un Poncho', src: encodeURI('/music/OctoBits and Pieces/tres-fucoz-y-un-poncho.mp3') },
      { title: 'Waltz with the Monster', src: encodeURI('/music/OctoBits and Pieces/waltz-with-the-monster.mp3') },
      { title: 'Watch Me Now', src: encodeURI('/music/OctoBits and Pieces/watch-me-now.mp3') },
    ],
  },
];

export const HARDWARE_ITEMS = [
  'Custom PCB design and SMD assembly',
  'ESP32 / Arduino microcontrollers',
  'Addressable LEDs and lighting systems',
  'PIR sensors, audio-reactive installations',
  'Raspberry Pi for AV and generative audio',
  'OLED displays and companion robots',
];

export const PRINCIPLES = [
  { title: 'Deep Work Over Busy Work', text: 'I do my best thinking in long, uninterrupted blocks. I protect focus time and batch context switches deliberately.' },
  { title: 'Written Over Verbal', text: 'My clearest thinking is written. I prefer async communication — it gives space for considered responses.' },
  { title: 'Context Before Action', text: 'Give me the "what" and "why" upfront and I\'ll move fast. Without context, I spiral into assumptions.' },
  { title: 'Scope Over Deadlines', text: 'I work best when I understand the boundaries of a task. "Do X within Y" beats open-ended ambiguity.' },
  { title: 'Build to Ship', text: 'Bias toward action. Working version first, refinement second. I\'d rather show something real than present a plan.' },
  { title: 'Feedback as Dialogue', text: '"Have you considered…" lands better than "this is wrong." Reasoning helps me learn; correction alone doesn\'t.' },
];

export const STRENGTHS = [
  { title: 'Debugging & Investigation', text: 'I thrive on the clue → hypothesis → test → result loop. Production incidents and tricky bugs energise me.' },
  { title: 'Pattern Recognition', text: 'I naturally spot connections across seemingly unrelated systems. Useful for architecture and root cause analysis.' },
  { title: 'Rapid Prototyping', text: 'I default to building. A working prototype surfaces problems faster than a spec ever will.' },
  { title: 'Documentation & Knowledge', text: 'I obsessively document systems, decisions, and runbooks — because future-me will forget everything.' },
];

export const COLLABORATION = [
  { title: 'Respect Flow State', text: 'If I\'m locked in, an async message beats a tap on the shoulder. I\'ll get to it.' },
  { title: 'Explicit Scope', text: '"30 minutes max" or "take your time" — either works. Without it, everything feels equally urgent.' },
  { title: 'Written Follow-ups', text: 'After meetings, I prefer written summaries. It\'s how I process and retain decisions.' },
  { title: 'Constructive Framing', text: 'I respond best to collaborative critique. Walk me through the reasoning, not just the verdict.' },
];
