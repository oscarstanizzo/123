import { chromium } from 'playwright';
import { existsSync } from 'fs';

/* This box ships Chromium at a fixed path and pins
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, so the npm package's own build number does
   not always match what is on disk. Prefer the preinstalled binary when it is
   there and fall back to whatever Playwright resolves on its own. */
const PREINSTALLED = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export const SITE = process.env.PEAR_URL || 'http://127.0.0.1:8765/index.html';

export function launch() {
  const executablePath = process.env.CHROME_PATH ||
    (existsSync(PREINSTALLED) ? PREINSTALLED : undefined);
  return chromium.launch(executablePath ? { executablePath } : {});
}
