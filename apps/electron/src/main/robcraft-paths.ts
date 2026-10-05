import { join } from 'node:path'
export function getRobCraftStatePaths(home: string) {
  return { craft: join(home, '.local', 'share', 'robcraft'), electron: join(home, '.config', 'robcraft') }
}
