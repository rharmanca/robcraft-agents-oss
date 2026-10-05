import { join } from 'node:path'

/** Pure path construction; this is not a filesystem or security boundary. */
export function getTrialStatePaths(home: string) {
  return {
    craft: join(home, '.local', 'share', 'robcraft-trial', 'craft'),
    electron: join(home, '.config', 'robcraft-trial', 'electron'),
  }
}
