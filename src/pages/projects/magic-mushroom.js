import React from 'react';

const MagicMushroomPage = () => (
  <main className="main">
    <nav className="main-menu">
      <ul>
        <li><a href="/">Home</a></li>
      </ul>
    </nav>
    
    <section className="section hero-section">
      <h1 className="sectionTitle">Magic Mushroom LED Strip</h1>
      <p className="text">A psychedelic and visually immersive LED strip project inspired by the organic shapes and vibrant colors of mushrooms. The LED strip is arranged in a circular mode to evoke a sense of movement and shifting light patterns. Powered by an Arduino and ESP32, this project is a combination of hardware tinkering and creative coding.</p>
      <img 
        className="project-image"
        src="https://placehold.co/800x400"
        alt="Magic Mushroom LED Strip project showcase"
      />
    </section>

    <section id="project-details" className="section">
      <h2 className="sectionTitle">Project Overview</h2>
      <p className="text">
        The Magic Mushroom LED Strip is designed to create an immersive lighting effect using WS2812B LEDs arranged in a circular formation. Each LED is individually addressable, allowing for complex animations and patterns. The project is powered by an Arduino Nano and controlled with an ESP32 for advanced features. The animations are triggered by distance sensors, creating dynamic lighting effects that change based on user interaction.
      </p>
      <p className="text">
        The project simulates organic movements with shifting, psychedelic colors. The LEDs are fully on during normal operation, with three pixels moving in a contrasting color to add dynamic effects. The system is also configured to react to distance, slowing down the animation or stopping entirely when the sensor detects a large gap, making the project both visually engaging and interactive.
      </p>
    </section>

    <section id="project-tech" className="section">
      <h2 className="sectionTitle">Technologies Used</h2>
      <ul className="tech-list">
        <li>Arduino Nano with an old bootloader</li>
        <li>ESP32 for advanced control</li>
        <li>WS2812B LED Strip (5M, 5V)</li>
        <li>Distance sensors for interaction</li>
        <li>DC to DC step-up module (ALAMSCN MT3608)</li>
        <li>Battery-powered (18650 lithium batteries)</li>
      </ul>
    </section>

    <section id="project-challenges" className="section">
      <h2 className="sectionTitle">Challenges Faced</h2>
      <p className="text">
        One of the biggest challenges in this project was dealing with sensor false positives and ensuring smooth, continuous animations. Another issue was optimizing the power consumption since the project runs on a battery. Additionally, controlling the LED strip’s brightness and animations without flickering required careful timing and precise coding.
      </p>
    </section>

    <section id="project-gallery" className="section">
      <h2 className="sectionTitle">Gallery</h2>
      <div className="gallery-grid">
        <img 
          className="gallery-image" 
          src="https://placehold.co/600x400" 
          alt="Magic Mushroom LED strip in action"
        />
        <img 
          className="gallery-image" 
          src="https://placehold.co/600x400" 
          alt="Close-up of the LED strip and sensor setup"
        />
      </div>
    </section>

    <section id="project-links" className="section">
      <h2 className="sectionTitle">Explore More</h2>
      <ul className="link-list">
        <li><a href="https://github.com/yourusername/magic-mushroom-led" className="link">View on GitHub</a></li>
        <li><a href="/projects" className="link">Back to Projects</a></li>
      </ul>
    </section>

    <section id="project-contact" className="section">
      <h2 className="sectionTitle">Contact Me</h2>
      <p className="text">Have questions or want to learn more about the Magic Mushroom LED Strip project? Feel free to reach out!</p>
      <ul className="contact-list">
        <li>Email: <a href="mailto:jack@jackmusajo.it" className="link">jack@jackmusajo.it</a></li>
        <li>LinkedIn: <a href="https://www.linkedin.com/in/jackmusajo" className="link">linkedin.com/in/jackmusajo</a></li>
      </ul>
    </section>
  </main>
);

export default MagicMushroomPage;
