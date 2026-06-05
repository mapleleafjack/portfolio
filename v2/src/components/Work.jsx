import { BRANDS, KEY_PROJECTS, SKILLS } from '../data';

export default function Work() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-12">Work</h1>

      {/* Brands */}
      <section className="mb-16">
        <p className="text-lg leading-relaxed">
          {BRANDS.map((b, i) => (
            <span key={b.name}>
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="font-medium">{b.name}</a>
              {i < BRANDS.length - 1 && <span className="text-gray-300"> · </span>}
            </span>
          ))}
        </p>
      </section>

      {/* Projects */}
      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Projects</h2>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {KEY_PROJECTS.map((group) =>
              group.projects.map((p, i) => (
                <tr key={p.name} className="border-t border-gray-100 align-top">
                  {i === 0 ? (
                    <td className="py-2 pr-6 text-gray-400 whitespace-nowrap" rowSpan={group.projects.length}>
                      {group.company}
                    </td>
                  ) : null}
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 text-gray-400">
                    {p.description}
                    {p.impact && <span> — {p.impact}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Skills</h2>
        {Object.entries(SKILLS).map(([cat, items]) => (
          <p key={cat} className="text-sm mb-1">
            <span className="text-gray-400">{cat}</span>{' '}
            {items.join(', ')}
          </p>
        ))}
      </section>
    </div>
  );
}
