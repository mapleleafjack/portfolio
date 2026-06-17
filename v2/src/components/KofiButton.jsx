import { useEffect } from 'react';

export default function KofiButton() {
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const r = parseInt(root.getPropertyValue('--accent-r')) || 200;
    const g = parseInt(root.getPropertyValue('--accent-g')) || 200;
    const b = parseInt(root.getPropertyValue('--accent-b')) || 200;

    const mix = (c, white, t) => Math.round(white + (c - white) * t);
    const bgR = mix(r, 240, 0.12);
    const bgG = mix(g, 240, 0.12);
    const bgB = mix(b, 240, 0.12);
    const bg = `#${[bgR, bgG, bgB].map(c => c.toString(16).padStart(2, '0')).join('')}`;

    const txR = mix(r, 80, 0.35);
    const txG = mix(g, 80, 0.35);
    const txB = mix(b, 80, 0.35);
    const tx = `#${[txR, txG, txB].map(c => c.toString(16).padStart(2, '0')).join('')}`;

    const style = document.createElement('style');
    style.textContent = `
      .floatingchat-container-wrap {
        transform: scale(0.8);
        transform-origin: bottom left;
      }
      @media (max-width: 640px) {
        .floatingchat-container-wrap {
          transform: scale(0.45);
        }
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.onload = () => {
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw('jack2438', {
          type: 'floating-chat',
          'floating-chat.donateButton.text': 'Espresso',
          'floating-chat.donateButton.background-color': bg,
          'floating-chat.donateButton.text-color': tx,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
      style.remove();
      const frame = document.getElementById('kofi-widget-overlay');
      if (frame) frame.remove();
    };
  }, []);

  return null;
}
