// Hostinger entry file (CommonJS, so it works whether the host runs `node server.cjs` or require()s it)
// Starts the Express backend, which also serves the built React app
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Hostinger's Express preset has no build step; build the React app if postinstall didn't
if (!fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
  console.log('📦 dist/ not found, building the React app...');
  execSync(`"${process.execPath}" node_modules/vite/bin/vite.js build`, { cwd: __dirname, stdio: 'inherit' });
}

require('./server/server.js');
