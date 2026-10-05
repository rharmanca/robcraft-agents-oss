/**
 * Central trial state resolver. A clean launcher/early bootstrap sets the explicit
 * trial directory; standalone consumers use the same distinct default.
 * This path convention is not a filesystem access-control boundary.
 */

import { homedir } from 'os';
import { join } from 'path';

export const DEFAULT_CONFIG_DIR_NAME = '.local/share/robcraft-trial/craft';

/**
 * Resolve the config directory: a non-empty CRAFT_CONFIG_DIR wins, otherwise
 * `<home>/.local/share/robcraft-trial/craft`. Evaluated once at load.
 */
export function resolveConfigDir(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string {
  const override = env.CRAFT_CONFIG_DIR?.trim();
  return override ? override : join(home, DEFAULT_CONFIG_DIR_NAME);
}

export const CONFIG_DIR = resolveConfigDir();
