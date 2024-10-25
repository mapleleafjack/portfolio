import React from 'react';
import { Link } from 'gatsby';
import HeroSection from '../components/HeroSection/HeroSection';
import ProjectCard from '../components/ProjectCard/ProjectCard';
import MainMenu from '../components/MainMenu/MainMenu';
import './index.css';

const IndexPage = () => (
  <main className="main">
    <MainMenu />
    <HeroSection />

    <section id="about" className="section">
      <h2 className="sectionTitle">About Me</h2>
      <p className="text">
        I'm Jack, a software engineer with over a decade of experience in full-stack development.
        I blend creativity and technology, creating projects that combine software, audio, and visual elements.
        My current focus includes web animations, hardware projects using ESP32 and Arduino, and AI-powered tools.
      </p>
    </section>

    <section id="projects" className="section">
      <h2 className="sectionTitle">Projects</h2>
      <div className="project-grid">
        <ProjectCard
          image="https://placehold.co/600x400"
          title="Magic Mushroom LED Strip"
          description="A visually striking, circular LED strip project designed to evoke a psychedelic effect, powered by Arduino and ESP32."
          link="projects/magic-mushroom"  // This is the new page link
          gradient="linear-gradient(135deg, #ff00ff, #00ffff)"
        />
        <ProjectCard
          image="https://placehold.co/600x400"
          title="ESP32 TamagoChing"
          description="A mindful digital pet project that evolves with user meditation and breathing exercises."
          link="/projects/tamagoching"
          gradient="linear-gradient(135deg, #ff7e5f, #feb47b)"
        />
        <ProjectCard
          image="https://placehold.co/600x400"
          title="Binance Python CLI Tool"
          description="A tool to interact with the Binance API for fetching balances and executing trades."
          link="/projects/binance-cli"
          gradient="linear-gradient(135deg, #6a11cb, #2575fc)"
        />
      </div>
    </section>

    <section className="section">
      <h2 className="sectionTitle">Skills</h2>
      <ul className="skillList">
        <li className="skillItem">JavaScript (React, TypeScript)</li>
        <li className="skillItem">Python</li>
        <li className="skillItem">Gatsby, Node.js</li>
        <li className="skillItem">Arduino, ESP32</li>
        <li className="skillItem">AWS, Terraform, Docker</li>
      </ul>
    </section>

    <section className="section">
      <h2 className="sectionTitle">Contact</h2>
      <ul className="contactList">
        <li>Email: <a href="mailto:jack@jackmusajo.it" className="link">jack@jackmusajo.it</a></li>
        <li>LinkedIn: <a href="https://www.linkedin.com/in/jackmusajo" className="link">linkedin.com/in/jackmusajo</a></li>
      </ul>
    </section>
  </main>
);

export default IndexPage;
