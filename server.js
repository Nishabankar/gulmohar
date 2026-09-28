// Hostinger entry file: starts the Express backend (which also serves the built React app)
import { existsSync } from 'fs';

// Hostinger's Express preset has no build step; build the React app if postinstall didn't
if (!existsSync(new URL('./dist/index.html', import.meta.url))) {
  console.log('📦 dist/ not found, building the React app...');
  const { build } = await import('vite');
  await build();
}

await import('./server/server.js');
