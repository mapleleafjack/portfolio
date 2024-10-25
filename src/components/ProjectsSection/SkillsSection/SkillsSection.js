// components/SkillsSection/SkillsSection.js
import React, { useState } from 'react';

const SkillsSection = ({ selectedSkills, setSelectedSkills }) => {
  const skills = ["JavaScript", "Python", "Gatsby", "Node.js", "Arduino", "ESP32", "AWS", "Terraform", "Docker"];

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <section id="skills" className="section">
      <h2 className="sectionTitle">Skills</h2>
      <ul className="skillList">
        {skills.map((skill) => (
          <li
            key={skill}
            className={`skillItem ${selectedSkills.includes(skill) ? 'selected' : ''}`}
            onClick={() => toggleSkill(skill)}
          >
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SkillsSection;
