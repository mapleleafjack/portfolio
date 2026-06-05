import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    {
      name: 'static-html',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const match = req.url?.match(/^\/([a-z0-9-]+)\/?$/);
          if (match) {
            const file = path.join(__dirname, 'public', match[1], 'index.html');
            if (fs.existsSync(file)) {
              res.setHeader('Content-Type', 'text/html');
              fs.createReadStream(file).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
    react(),
    tailwindcss(),
  ],
})
