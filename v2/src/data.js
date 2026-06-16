export const FEATURED_PROJECTS = [
  {
    name: 'Vision LED Poi',
    category: 'Creative',
    year: '2023–25',
    description: 'Custom hardware/software performance prop with motion-reactive LEDs.',
    url: 'https://www.instagram.com/jackmusajo',
  },
  {
    name: 'SlimeChan',
    category: 'Creative',
    year: '2025',
    description: 'LLM-powered interactive slime colony — each slime has its own personality.',
    url: 'https://www.slimechan.xyz/',
  },
];

export const ROTATING_PHRASES = [
  'building tools',
  'building interfaces',
  'building creative systems',
  'building hardware experiments',
  'building playful systems',
  'building LED props',
];

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
  { name: 'EGC', url: 'https://egccore-production.up.railway.app/', logo: brandLogo('egccore-production.up.railway.app') },
];

export const KEY_PROJECTS = [
  {
    company: 'BlackRock',
    projects: [
      {
        name: 'LPA Extractor',
        slug: 'lpa-extractor',
        tech: ['Python', 'LLM', 'RAG', 'Kubernetes'],
        description: 'AI-powered legal document extraction',
        impact: '6h → 1h per document',
        detail: {
          subtitle: 'BlackRock / Preqin — AI-Powered Document Extraction',
          role: 'Senior Software Engineer',
          period: 'Dec 2024 – present',
          overview: 'Limited Partnership Agreements (LPAs) are dense legal documents that lawyers had to review manually to extract economic terms — management fees, carried interest, waterfalls. Each document took around 6 hours. I built a tool that uses RAG Chains and LLMs to reduce that to about 1 hour.',
          sections: [
            {
              title: 'The Problem',
              content: 'Lawyers were spending 6 hours per LPA manually identifying and extracting economic terms from legal documents that can run to hundreds of pages. The process was slow, expensive, and didn\'t scale with the volume of agreements the team needed to process.',
            },
            {
              title: 'What I Built',
              content: 'An extraction pipeline using retrieval-augmented generation (RAG) — the system chunks the document, retrieves relevant sections, and uses an LLM to extract structured term data. Integrated Heap analytics to track user behaviour and identify UX bottlenecks. Deployed via Kubernetes with TeamCity CI/CD.',
            },
            {
              title: 'Impact',
              content: 'Reduced processing time from 6 hours to approximately 1 hour per document. The tool is now used by the legal team as part of their standard workflow.',
            },
          ],
        },
      },
      {
        name: 'Term Intelligence',
        slug: 'term-intelligence',
        tech: ['React', 'Python', 'GraphQL', 'Snowflake'],
        description: 'Fund term analysis product replacing PowerBI prototype',
        detail: {
          subtitle: 'BlackRock / Preqin — Fund Term Analysis Platform',
          role: 'Senior Software Engineer',
          period: 'Dec 2024 – present',
          overview: 'Migrated the Term Intelligence product from a standalone PowerBI prototype into the main Service Provider platform — turning a temporary internal tool into a polished product for end users.',
          sections: [
            {
              title: 'What I Built',
              content: 'Full data flow from React micro-frontend through GraphQL queries to Snowflake stored procedures. Built a comprehensive filter system covering asset class/strategy trees, vintage years, fund size ranges, regional focus, and waterfall types. Implemented chart components including management fee tables, stepdown charts, pie charts, and stacked bar charts.',
            },
            {
              title: 'Architecture',
              items: [
                'React MFE → GraphQL query → sp-data-provider resolver → Snowflake stored procedure',
                'Module Federation for micro-frontend integration into the main platform',
                'Documented the complete data flow and handed over remaining work with full context',
              ],
            },
          ],
        },
      },
      {
        name: 'AI Dev Workflows',
        slug: 'breadkit',
        tech: ['Node.js', 'AI/LLM', 'MCP', 'REST APIs'],
        description: 'Reusable AI workflows for Jira, Bitbucket, Confluence',
        detail: {
          subtitle: 'BlackRock / Preqin — AI Development Framework',
          role: 'Senior Software Engineer',
          period: 'Dec 2024 – present',
          overview: 'Adapted BlackRock\'s internal AI-assisted development framework (BreadKit) for the Preqin engineering team, which uses Jira/Bitbucket instead of Azure DevOps. Built the Atlassian MCP integration from scratch and published 8+ reusable workflows.',
          sections: [
            {
              title: 'Workflows Created',
              items: [
                'Jira ticket reader — fetch and summarise tickets via Atlassian MCP',
                'Confluence page reader — fetch pages with child pages and comments',
                'Bitbucket reader — PRs, diffs, comments, pipelines via REST API',
                'Automated MFE deploy — branch detection → build polling → deploy trigger via TeamCity API',
                'Automated container deploy — branch creation, config update, build status',
                'PR review tailored to Python stack (FastAPI + Strawberry + SQLAlchemy)',
                'Investigation saver — save debugging sessions to structured notes',
              ],
            },
            {
              title: 'Infrastructure',
              content: 'Created the team workspace and shared module with a PR-based contribution process. Built the Atlassian MCP integration from scratch — debugged stdio/HTTP transport, packaged for team setup. Published setup guide, workspace guide, and contribution guide to Confluence.',
            },
          ],
        },
      },
    ],
  },
  {
    company: 'Made Tech',
    projects: [
      {
        name: 'Housing Repairs SaaS',
        slug: 'housing-repairs',
        tech: ['React', 'Ruby on Rails', 'GOV.UK'],
        description: 'First SaaS product for local councils',
        detail: {
          subtitle: 'Made Tech — GOV.UK Housing Repairs Platform',
          role: 'Senior Full-Stack Engineer',
          period: 'Apr 2021 – Aug 2023',
          overview: 'Built and launched the company\'s first SaaS product — a housing repairs system for local councils that removed the barrier between service suppliers and council house tenants.',
          sections: [
            {
              title: 'The Problem',
              content: 'Council house tenants needing repairs had to navigate bureaucratic processes to get connected with service suppliers. The system was slow, opaque, and different for every council. Made Tech saw an opportunity to build a reusable SaaS product that could be deployed across multiple councils.',
            },
            {
              title: 'What I Built',
              content: 'Led the development of the GOV.UK Housing Repairs system — a full-stack application following GOV.UK design standards. The platform streamlined the entire repair request flow: tenants submit requests, the system routes them to appropriate suppliers, and both parties can track progress. Built as a genuinely reusable SaaS product, not a one-off council project.',
            },
            {
              title: 'Team Leadership',
              content: 'Managed a team of junior engineers — delegated tasks based on individual expertise, ensured efficient project delivery, and provided mentorship for professional growth. Actively participated in R&D technology discussions and authored extensive test suites across frontend and backend.',
            },
          ],
        },
      },
      {
        name: 'Hackney Social Care',
        slug: 'hackney-social-care',
        tech: ['React', '.NET', 'PostgreSQL'],
        description: 'Rebuilt critical public service after cyberattack',
        detail: {
          subtitle: 'Made Tech — Hackney Council Social Care System',
          role: 'Senior Full-Stack Engineer',
          period: 'Apr 2021 – Aug 2023',
          overview: 'Hackney Council suffered a cyberattack that took down their Social Care service — a critical system that real people depend on. I was part of the squad that restored it from backups, rewriting the application that supported it.',
          sections: [
            {
              title: 'The Situation',
              content: 'A cyberattack knocked out Hackney Council\'s Social Care service entirely. This wasn\'t an internal tool — it was a system that vulnerable people relied on for care coordination. The council needed it restored as quickly as possible, but the original codebase was compromised.',
            },
            {
              title: 'What I Did',
              content: 'Joined the recovery squad and helped rebuild the application from backups. This meant understanding the original system\'s data model and business logic from whatever was recoverable, then rewriting the application to restore full service. The new system was built with React and .NET backed by PostgreSQL.',
            },
            {
              title: 'Impact',
              content: 'Restored a critical public service that real people depended on. The rebuilt system was more robust than the original, with proper test coverage and modern architecture.',
            },
          ],
        },
      },
    ],
  },
  {
    company: 'Engage Hub',
    projects: [
      {
        name: 'Dragon Platform',
        slug: 'dragon-platform',
        tech: ['JavaScript', 'Java', 'REST APIs'],
        description: 'Enterprise comms automation for Bank of Ireland, Hermes, and others',
        detail: {
          subtitle: 'Engage Hub — Enterprise Communication Automation',
          role: 'Frontend Engineer',
          period: 'Jan 2017 – Apr 2021',
          overview: 'Dragon was Engage Hub\'s core product — a communication automation platform used by enterprise clients like Bank of Ireland and Hermes (now Evri) to streamline communications between services and end users.',
          sections: [
            {
              title: 'What the Platform Did',
              content: 'Dragon made communications streamlined between services and end users. For Bank of Ireland, that meant automated communications for password resets and bank statements. For Hermes, it meant keeping users updated on parcel status. The platform handled the templating, routing, and delivery of these communications at scale.',
            },
            {
              title: 'What I Built',
              items: [
                'Email drag-and-drop designer for Bank of Ireland communications',
                'Account permissions management system for loading different parts of the application per user role',
                'White-labelling engine for branding the application to be sold to different clients',
                'Phone payment system and system notification framework',
                'Rewrote the internal component library to follow new designs',
              ],
            },
            {
              title: 'Impact',
              content: 'The platform served multiple enterprise clients simultaneously, each with their own branding and permission structure. The white-labelling engine I built was key to making the product commercially viable across different organisations.',
            },
          ],
        },
      },
    ],
  },
  {
    company: 'Sano Genetics',
    projects: [
      {
        name: 'Bio Pipeline Automation',
        slug: 'bio-pipeline',
        tech: ['Python', 'AWS', 'NextFlow', 'Terraform'],
        description: 'Automated cloud workflows for bioengineering research',
        detail: {
          subtitle: 'Sano Genetics — Bioengineering Platform & Pipelines',
          role: 'Backend / Bio Engineer',
          period: 'Aug 2023 – Oct 2024',
          overview: 'Sano Genetics is a biotech company working with genetic research. I expanded their application backend and built the synchronisation infrastructure that connected lab results to bio pipelines — replacing local scripts with automated cloud workflows.',
          sections: [
            {
              title: 'The Problem',
              content: 'Bio engineers were running analysis pipelines locally — downloading results from analysis companies, running scripts on their machines, and uploading outputs manually. This was error-prone, didn\'t scale, and created no audit trail of what ran and when.',
            },
            {
              title: 'What I Built',
              items: [
                'Synchronisation scripts ensuring data flow between lab results and bio pipelines, triggered automatically via AWS bucket events',
                'NextFlow pipeline integration — lab results uploaded by analysis companies trigger cloud-hosted pipelines instead of local scripts',
                'Expanded the application backend supporting bioengineering projects, genetic research, and logistical operations',
                'GitHub Actions workflows to automate code quality checks and trigger synchronisation scripts',
                'Infrastructure expansion and optimisation using Terraform',
              ],
            },
            {
              title: 'Impact',
              content: 'Bio engineers stopped running local scripts and instead had their pipelines hosted on NextFlow, triggered automatically via AWS when results were uploaded. The backend gave users access to data from analysis of their DNA samples through a proper application rather than ad-hoc queries.',
            },
          ],
        },
      },
    ],
  },
  {
    company: 'Sixs',
    projects: [
      {
        name: 'Social Care System',
        slug: 'sixs-social-care',
        tech: ['Java', 'Vaadin', 'Android', 'NFC'],
        description: 'Full management system for social care cooperatives',
        detail: {
          subtitle: 'Sixs — Social Care Management Platform',
          role: 'Software Engineer',
          period: 'Aug 2014 – Jan 2017',
          overview: 'Built and maintained a complete Social Care management solution used by cooperatives for accountancy and employee management — my first professional engineering role, in Crema, Italy.',
          sections: [
            {
              title: 'What I Built',
              items: [
                'Core Social Care solution for accountancy purposes using Java/Vaadin',
                'Companion apps for Android and Windows Phone, published on their respective app stores',
                'NFC tag integration for time-tracking — employees tap to clock in/out',
                'APIs connecting the mobile apps to the main platform',
              ],
            },
            {
              title: 'What I Learned',
              content: 'This was where I cut my teeth as a professional engineer. I learned to ship real software that people depend on — from designing APIs to publishing mobile apps to handling customer support. The NFC time-tracking integration was my first taste of hardware-software integration, which became a lasting interest.',
            },
          ],
        },
      },
    ],
  },
  {
    company: 'EGC (Freelance)',
    projects: [
      {
        name: 'Grading Management System',
        slug: 'egc',
        tech: ['React 19', 'FastAPI', 'Supabase'],
        description: 'End-to-end comic book grading platform — replaced Excel workflows with a full software solution',
        url: 'https://egccore-production.up.railway.app/',
        detail: {
          subtitle: 'European Grading Company — Comic Book Grading Platform',
          role: 'Sole Developer (Freelance)',
          period: '2025 – present',
          liveUrl: 'https://egccore-production.up.railway.app/',
          overview: 'EGC is a comic book grading company that was running their entire operation — intake, grading, invoicing, tracking — through Excel spreadsheets. I was brought in to understand their data flow end-to-end and build a complete software solution from scratch.',
          sections: [
            {
              title: 'The Problem',
              content: 'The company managed thousands of comic book submissions through a maze of spreadsheets. Every comic passed through multiple stages — intake, identification, grading, quality review, invoicing — and each step was a manual copy-paste between sheets. There was no single source of truth, no audit trail, and errors compounded silently.',
            },
            {
              title: 'My Approach',
              content: 'I spent time studying their existing Excel workflows to map the real domain: how comics enter the system, what data gets captured at each stage, how grading decisions are made, and how results flow to invoicing. I modelled the domain around their actual process rather than imposing a generic CRUD structure.',
            },
            {
              title: 'What I Built',
              content: 'A full-stack platform covering the entire grading lifecycle. The backend is a FastAPI service with a PostgreSQL database on Supabase, designed around the real domain concepts — submissions, comics, gradings, certifications. The frontend is a React 19 SPA that gives operators a streamlined interface for each stage of the process: barcode-driven intake, structured grading forms, supervisor review queues, and automated certificate generation.',
            },
            {
              title: 'Key Technical Decisions',
              items: [
                'Domain-driven design with Italian identifiers matching the business language (titolo, voto, progressivo)',
                'Barcode-based intake system for fast physical comic registration',
                'Role-based access — operators, graders, supervisors each see only what they need',
                'Deployed on Railway with Supabase for managed PostgreSQL and auth',
              ],
            },
            {
              title: 'Impact',
              content: 'Replaced a fragile spreadsheet process with a reliable, auditable system. The company can now track every comic from intake to certification with full history. What used to require careful manual coordination across multiple people and spreadsheets is now a guided workflow with validation at each step.',
            },
          ],
        },
      },
    ],
  },
];

export const SKILLS = {
  Languages: ['Python', 'JavaScript / TypeScript', 'C#', 'C++', 'Java'],
  Frameworks: ['React', 'FastAPI', 'GraphQL (Strawberry)', '.NET', 'Next.js'],
  Infrastructure: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'PostgreSQL', 'Supabase', 'NextFlow'],
  Practices: ['Clean Architecture', 'RESTful APIs', 'CI/CD', 'Code Reviews', 'ETL Pipelines'],
  Hardware: ['Arduino / ESP32', 'PCB Design (EasyEDA)', 'SMD Assembly', 'Addressable LEDs', 'Sensors & Gyroscopes'],
  Other: ['AI / LLM Integration', 'Barcode Recognition', 'Lab Automation', 'Android', 'Linux'],
};

export const SIDE_PROJECTS = [
  {
    name: 'EsPoi — LED Poi',
    url: 'https://github.com/mapleleafjack/EsPoi',
    github: 'https://github.com/mapleleafjack/EsPoi',
    description: 'Custom ESP32 LED juggling prop with gyro-reactive effects, BLE control, and POV animation',
  },
  {
    name: 'SlimeChan',
    url: 'https://www.slimechan.xyz/',
    github: 'https://github.com/mapleleafjack/slime-chan',
    description: 'LLM-powered interactive slime colony — each slime has its own personality',
  },
  {
    name: 'Glypho',
    url: 'https://www.glypho.xyz/',
    description: 'Creative web experiment exploring generative art and typography',
  },
  {
    name: 'BMO',
    url: 'https://github.com/mapleleafjack/BMO',
    github: 'https://github.com/mapleleafjack/BMO',
    description: 'ESP32 microcontroller project with display and I²C peripheral integration',
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
  'Custom PCB design and SMD assembly (EasyEDA, 0603 packages)',
  'ESP32 / Arduino microcontroller programming',
  'Addressable LEDs and reactive lighting systems (APA102)',
  'Gyroscopes, PIR sensors, audio-reactive installations',
  'BLE wireless control and OTA firmware updates',
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
