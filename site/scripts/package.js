// Builds the static site with site/.env.production and zips dist/ into gulmohar-site.zip (repo root).
// Upload the zip to Hostinger File Manager and extract it inside public_html.
// Works on Windows (built-in tar.exe, Windows 10+) and Linux/macOS (zip).
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const zipPath = join(siteDir, '..', 'gulmohar-site.zip');

// The contact form must know where the CRM API lives, otherwise leads are lost silently
const envProd = readFileSync(join(siteDir, '.env.production'), 'utf8');
if (!/^VITE_API_URL=[ \t]*\S/m.test(envProd)) {
  console.error('❌ Set VITE_API_URL (the HouseDeal CRM address) in site/.env.production before packaging.');
  process.exit(1);
}

execSync('npx vite build --mode production', { cwd: siteDir, stdio: 'inherit' });

rmSync(zipPath, { force: true });
const dist = join(siteDir, 'dist');
if (process.platform === 'win32') {
  // Not PowerShell Compress-Archive: it writes "assets\\images\\x.jpg" paths that Linux extracts as flat files.
  // Windows' bsdtar writes proper "/" paths; list top-level entries so the zip has no "./" prefix.
  const entries = readdirSync(dist).map(n => `"${n}"`).join(' ');
  execSync(`tar.exe -a -c -f "${zipPath}" -C "${dist}" ${entries}`, { stdio: 'inherit' });
} else {
  execSync(`zip -qr "${zipPath}" .`, { cwd: dist, stdio: 'inherit' });
}

if (!existsSync(zipPath)) {
  console.error('❌ Zip was not created.');
  process.exit(1);
}
console.log(`✅ ${zipPath}\n   Upload to Hostinger → File Manager → public_html → extract.`);
