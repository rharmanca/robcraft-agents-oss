/** Must be the first main-entry import, before logging/config/session modules. */
import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import { homedir, userInfo } from 'node:os'
import { join } from 'node:path'
import { getTrialStatePaths } from './trial-paths'

// This build is deliberately specific to the approved, non-login trial account.
if (userInfo().username !== 'crafttrial' || homedir() !== '/home/crafttrial') {
  throw new Error('RobCraft Trial must run under its separately approved crafttrial identity.')
}
// This is an additional early safeguard, not a substitute for a clean future launcher.
const allowed = new Set([
  'HOME', 'USER', 'LOGNAME', 'LANG', 'LC_ALL', 'LC_CTYPE',
  'DISPLAY', 'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS',
  'XAUTHORITY', 'APPIMAGE', 'APPDIR', 'TERM',
])
for (const name of Object.keys(process.env)) {
  if (!allowed.has(name)) delete process.env[name]
}
const home = homedir()
const paths = getTrialStatePaths(home)
process.env.HOME = home
process.env.USER = 'crafttrial'
process.env.LOGNAME = 'crafttrial'
process.env.PATH = '/home/crafttrial/.local/bin:/usr/local/bin:/usr/bin:/bin'
process.env.XDG_CONFIG_HOME = join(home, '.config')
process.env.XDG_CACHE_HOME = join(home, '.cache')
process.env.XDG_DATA_HOME = join(home, '.local', 'share')
process.env.TMPDIR = join(home, '.cache', 'robcraft-trial', 'tmp')
process.env.CRAFT_CONFIG_DIR = paths.craft
process.env.CRAFT_APP_NAME = 'RobCraft Trial'
process.env.CRAFT_DEEPLINK_SCHEME = 'robcraft-trial-disabled'
process.env.CRAFT_RPC_HOST = '127.0.0.1'
process.env.CRAFT_RPC_PORT = '0'
app.setName('RobCraft Trial')
mkdirSync(paths.electron, { recursive: true, mode: 0o700 })
mkdirSync(process.env.TMPDIR, { recursive: true, mode: 0o700 })
app.setPath('userData', paths.electron)
app.setPath('sessionData', paths.electron)
