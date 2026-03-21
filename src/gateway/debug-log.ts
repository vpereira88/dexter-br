import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const LOG_PATH = join(homedir(), '.dexter', 'gateway-debug.log');
const DEBUG = process.env.DEXTER_DEBUG === '1';

/**
 * Best-effort debug logging for gateway flows.
 * Logging must never interrupt delivery, access control, or heartbeat runs.
 */
export function appendGatewayDebugLog(msg: string): void {
  try {
    const logDir = dirname(LOG_PATH);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    appendFileSync(LOG_PATH, `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // Ignore logging failures. Debug output is non-critical.
  }
  if (DEBUG) process.stderr.write(`[debug] ${msg}\n`);
}
