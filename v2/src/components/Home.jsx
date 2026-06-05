import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="py-24">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-16">
        <div>
          <h1 className="text-4xl font-bold mb-4">Jack Musajo</h1>
          <p className="text-lg text-gray-500">
            Software Engineer &amp; Creative Technologist
          </p>
        </div>
        <div className="text-sm text-gray-400 sm:text-right space-y-1 sm:pt-2">
          <p><a href="mailto:jack.musajo@gmail.com">jack.musajo@gmail.com</a></p>
          <p><a href="https://github.com/mapleleafjack" target="_blank" rel="noopener noreferrer">GitHub</a></p>
          <p><a href="https://www.linkedin.com/in/chakri-musajo-somma" target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p><Link to="/work">Work</Link> — projects, skills, experience</p>
        <p><Link to="/creative">Creative</Link> — music, hardware, performance</p>
      </div>
    </div>
  );
}
