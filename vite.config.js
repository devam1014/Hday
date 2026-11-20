import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const AUDIO_REGEX = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i;

function extractNumericValue(filename) {
  if (!filename || typeof filename !== 'string') return Infinity;
  const name = filename.split('?')[0].split('/').pop().trim();
  const leading = name.match(/^(\d+)/);
  if (leading) return parseInt(leading[1], 10);
  return Infinity;
}

function numericSortCompare(a, b) {
  const numA = extractNumericValue(a);
  const numB = extractNumericValue(b);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function musicManifestPlugin() {
  const updateManifest = () => {
    const getAudioFiles = (dir) => {
      const p = path.resolve(process.cwd(), dir);
      if (!fs.existsSync(p)) return [];
      return fs.readdirSync(p)
        .filter(f => !f.startsWith('.') && AUDIO_REGEX.test(f))
        .sort(numericSortCompare);
    };

    const manifest = {
      music: getAudioFiles('public/music'),
      sad: getAudioFiles('public/sad-songs'),
      happy: getAudioFiles('public/happy-songs'),
      qna: getAudioFiles('public/QNA-music'),
    };

    const target = path.resolve(process.cwd(), 'src/config/music-manifest.json');
    const content = JSON.stringify(manifest, null, 2);
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) {
      fs.writeFileSync(target, content, 'utf8');
    }
  };

  const isAudioDir = (filePath) => (
    filePath.includes('public/music') ||
    filePath.includes('public/sad-songs') ||
    filePath.includes('public/happy-songs') ||
    filePath.includes('public/QNA-music') ||
    filePath.includes('public\\music') ||
    filePath.includes('public\\sad-songs') ||
    filePath.includes('public\\happy-songs') ||
    filePath.includes('public\\QNA-music')
  );

  return {
    name: 'music-manifest-generator',
    buildStart() {
      updateManifest();
    },
    configureServer(server) {
      updateManifest();
      server.watcher.on('add', (filePath) => {
        if (isAudioDir(filePath)) updateManifest();
      });
      server.watcher.on('unlink', (filePath) => {
        if (isAudioDir(filePath)) updateManifest();
      });
      server.watcher.on('change', (filePath) => {
        if (isAudioDir(filePath)) updateManifest();
      });
    }
  };
}

export default defineConfig({
  assetsInclude: ['**/couple', 'couple', '**/sad/*', 'sad/*'],
  plugins: [react(), musicManifestPlugin()],
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
