import assert from 'node:assert/strict'
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { mock } from 'bun:test'
import { getTrialStatePaths } from '../apps/electron/src/main/trial-paths'

const home = homedir()
if (!home.endsWith('/tmp/synthetic-home')) throw new Error('Safety checks require the named synthetic fixture home')
const paths = getTrialStatePaths(home)
assert.equal(process.env.CRAFT_CONFIG_DIR, paths.craft)
assert.notEqual(paths.craft, join(home, '.craft-agent'))
assert.equal(paths.electron, join(home, '.config/robcraft-trial/electron'))
mkdirSync(join(home,'.craft-agent','workspaces','legacy-only'), { recursive: true })
writeFileSync(join(home,'.craft-agent','workspaces','legacy-only','marker.txt'),'synthetic legacy workspace\n')
writeFileSync(join(home,'.craft-agent','credentials.enc'),'synthetic legacy credential fixture; not a real credential\n')

const pathModule = await import('../packages/shared/src/config/paths')
assert.equal(pathModule.resolveConfigDir({}, home), paths.craft)
assert.equal(pathModule.CONFIG_DIR, paths.craft)
const interceptor = await import('../packages/shared/src/interceptor-common')
assert.equal(interceptor.CONFIG_FILE, join(paths.craft,'config.json'))
const workspace = await import('../packages/shared/src/workspaces/storage')
workspace.ensureDefaultWorkspacesDir()
assert.deepEqual(readdirSync(workspace.getDefaultWorkspacesDir()), [])
const { SecureStorageBackend } = await import('../packages/shared/src/credentials/backends/secure-storage')
assert.deepEqual(await new SecureStorageBackend().list(), [])
assert.equal(existsSync(join(paths.craft,'credentials.enc')), false)
assert.equal(existsSync(join(home,'.craft-agent','credentials.enc')), true)

// Importing the disabled updater must not load or configure an updater instance.
let updaterLoaded = false
mock.module('electron-updater', () => {
  updaterLoaded = true
  throw new Error('Updater must never be loaded in the trial')
})
const updater = await import('../apps/electron/src/main/auto-update')
let hookCalled = false
updater.setBeforeUpdateQuitHook(() => { hookCalled = true })
updater.setBeforeUpdateInstallHook(async () => { hookCalled = true })
updater.setInstallQuitFailedHook(() => { hookCalled = true })
assert.equal((await updater.checkForUpdates({ autoDownload: true })).available, false)
assert.equal((await updater.checkForUpdatesOnLaunch()).action, 'skipped')
await assert.rejects(updater.installUpdate(), /disabled for RobCraft Trial/)
assert.equal(updater.isUpdating(), false)
assert.equal(updaterLoaded, false)
assert.equal(hookCalled, false)

mock.module(resolve(import.meta.dir,'../apps/electron/src/main/logger.ts'), () => ({
  mainLog: { info() {}, error() {}, warn() {} },
}))
const { handleDeepLink } = await import('../apps/electron/src/main/deep-link')
const inaccessibleWindowManager = new Proxy({}, {
  get() { throw new Error('A disabled deep link must not access a window or execute an action') },
})
for (const url of ['craftagents://action/new-chat?input=synthetic&send=true','craftagents://auth-callback?code=synthetic','robcraft-trial-disabled://action/delete-session/synthetic']) {
  const result = await handleDeepLink(url, inaccessibleWindowManager as never)
  assert.equal(result.success, false)
  assert.match(result.error!, /disabled for RobCraft Trial/)
}
console.log('SAFETY_CHECKS_PASS: separate paths; no synthetic legacy imports; no updater instance/check/install/hooks; deep links denied. No Electron app was launched.')
