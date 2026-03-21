import { appendFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const LOG_PATH = join(homedir(), '.dexter', 'gateway-debug.log');
const DEBUG = process.env.DEXTER_DEBUG === '1';

// Ensure log directory exists
try {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
} catch {
  // ignore
}

export function debugLog(msg: string): void {
  const line = `${new Date().toISOString()} ${msg}\n`;
  try {
    appendFileSync(LOG_PATH, line);
  } catch {
    // ignore write errors
  }
  if (DEBUG) process.stderr.write(`[debug] ${msg}\n`);
}
