/** Normal RobCraft identity, before configuration or logger imports. */
import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import { homedir, userInfo } from 'node:os'
import { join } from 'node:path'
import { getRobCraftStatePaths } from './robcraft-paths'

if (process.getuid?.() === 0) throw new Error('RobCraft must not run as root.')
const user = userInfo()
const home = homedir()
const allowed = new Set([
  'HOME', 'USER', 'LOGNAME', 'LANG', 'LC_ALL', 'LC_CTYPE', 'DISPLAY',
  'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS',
  'XAUTHORITY', 'APPIMAGE', 'APPDIR', 'TERM',
])
for (const name of Object.keys(process.env)) {
  if (!allowed.has(name)) delete process.env[name]
}
const paths = getRobCraftStatePaths(home)
process.env.HOME = home
process.env.USER = user.username
process.env.LOGNAME = user.username
process.env.PATH = `${join(home, '.local', 'bin')}:/usr/local/bin:/usr/bin:/bin`
process.env.XDG_CONFIG_HOME = join(home, '.config')
process.env.XDG_CACHE_HOME = join(home, '.cache')
process.env.XDG_DATA_HOME = join(home, '.local', 'share')
process.env.TMPDIR = join(home, '.cache', 'robcraft', 'tmp')
process.env.CRAFT_CONFIG_DIR = paths.craft
process.env.CRAFT_APP_NAME = 'RobCraft'
process.env.CRAFT_DEEPLINK_SCHEME = 'craftagents'
process.env.CRAFT_RPC_HOST = '127.0.0.1'
process.env.CRAFT_RPC_PORT = '0'
app.setName('RobCraft')
mkdirSync(paths.electron, { recursive: true, mode: 0o700 })
mkdirSync(process.env.TMPDIR, { recursive: true, mode: 0o700 })
app.setPath('userData', paths.electron)
app.setPath('sessionData', paths.electron)
