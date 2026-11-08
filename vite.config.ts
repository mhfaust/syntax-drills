import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));
const pyodideDir = path.join(root, 'node_modules/pyodide');

/**
 * Serves the Pyodide runtime from node_modules at /pyodide/ in dev and copies it
 * into the build, so Python runs without a CDN.
 */
function servePyodide(): Plugin {
  const types: Record<string, string> = {
    '.mjs': 'text/javascript',
    '.js': 'text/javascript',
    '.wasm': 'application/wasm',
    '.json': 'application/json',
    '.zip': 'application/zip',
  };
  return {
    name: 'serve-pyodide',
    configureServer(server) {
      server.middlewares.use('/pyodide', (req, res, next) => {
        const file = path.join(pyodideDir, (req.url ?? '/').split('?')[0] ?? '/');
        if (!file.startsWith(pyodideDir) || !existsSync(file) || !statSync(file).isFile()) {
          next();
          return;
        }
        res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      for (const name of readdirSync(pyodideDir)) {
        if (!/\.(mjs|wasm|json|zip)$/.test(name) || name === 'package.json') continue;
        this.emitFile({
          type: 'asset',
          fileName: `pyodide/${name}`,
          source: readFileSync(path.join(pyodideDir, name)),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), servePyodide()],
  resolve: {
    alias: { '@': path.join(root, 'src') },
  },
  worker: { format: 'es' },
  server: { port: 5199, strictPort: true },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
