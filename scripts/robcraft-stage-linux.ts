import {
  downloadBun, downloadUv, copySDK, verifySDKCopy, copyRipgrep,
  copyInterceptor, copyInterceptorBundle,
  type BuildConfig,
} from './build/common'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'

const rootDir = resolve(import.meta.dir, '..')
const electronDir = join(rootDir, 'apps', 'electron')
const config: BuildConfig = {
  platform: 'linux', arch: 'x64', rootDir, electronDir,
  upload: false, uploadLatest: false, uploadScript: false,
}
const phase = process.argv[2]
if (phase !== 'prepare' && phase !== 'finalize') throw new Error('Use prepare or finalize only')
if (rootDir !== '/home/crafttrial/builds/robagents-ui-0.14.0-rob.2/source') {
  throw new Error('Staging is restricted to the approved source tree')
}
if (existsSync(join(rootDir, '.env'))) throw new Error('Build tree must contain no .env')
if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('This helper supports Linux x64 only')
for (const [name, value] of Object.entries(process.env)) {
  if (value && /TOKEN|SECRET|PASSWORD|API.?KEY|CREDENTIAL|AUTHORIZATION|CRAFT_SERVER_|AWS_|SENTRY_|NODE_OPTIONS|BUN_OPTIONS|LD_PRELOAD/.test(name)) {
    throw new Error(`Unapproved build environment variable: ${name}`)
  }
}

if (phase === 'prepare') {
  await downloadBun(config)
  await downloadUv(config)
  copySDK(config)
  verifySDKCopy(config)
  copyRipgrep(config)
  copyInterceptor(config)
} else {
  // Approved correction is specific to this frozen dependency graph. Never
  // silently drop a native requirement if a later bundle actually references it.
  const lock = readFileSync(join(rootDir, 'bun.lock'))
  if (createHash('sha256').update(lock).digest('hex') !== '50a9c1afa74b700b954bc580e08c907dea0b1dd3021cb7b2f7d2ce678a1aedb0') {
    throw new Error('Dependency lock differs from the approved pinned build')
  }
  const piSource = join(rootDir, 'packages/pi-agent-server/dist/index.js')
  if (!lstatSync(piSource).isFile() || lstatSync(piSource).size === 0) throw new Error('Pi subprocess must be a nonempty real compiled file')
  if (lock.toString('utf8').includes('koffi') || readFileSync(piSource, 'utf8').includes('koffi')) {
    throw new Error('koffi is present/referenced: this narrowly approved omission is not applicable')
  }
  for (const name of ['@earendil-works/pi-coding-agent', '@earendil-works/pi-ai']) {
    const manifest = JSON.parse(readFileSync(join(rootDir, 'node_modules', name, 'package.json'), 'utf8'))
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      if (manifest[field]?.koffi) throw new Error(`Unexpected native dependency in ${name}`)
    }
  }
  const piDest = join(electronDir, 'resources/pi-agent-server')
  mkdirSync(piDest, { recursive: true })
  copyFileSync(piSource, join(piDest, 'index.js'))
  console.log('PI_NATIVE_GATE_PASS: frozen lock and compiled consumer do not reference koffi; compiled subprocess copied')
  copyInterceptorBundle(config)
  copyInterceptor(config)
  verifySDKCopy(config)

  const required = [
    'dist/main.cjs', 'dist/bootstrap-preload.cjs', 'dist/browser-toolbar-preload.cjs',
    'dist/interceptor.cjs', 'dist/renderer/index.html',
    'vendor/bun/bun', 'resources/bin/linux-x64/uv',
    'node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs',
    'node_modules/@anthropic-ai/claude-agent-sdk-binary/claude',
    'node_modules/@vscode/ripgrep/bin/rg',
    'resources/pi-agent-server/index.js',

    'packages/shared/src/unified-network-interceptor.ts',
    'packages/shared/src/interceptor-common.ts',
    'packages/shared/src/feature-flags.ts',
    'packages/shared/src/interceptor-request-utils.ts',
    'resources/icon.png', 'dist/resources/powershell-parser.ps1',
    'dist/resources/config-defaults.json',
  ]
  for (const name of ['markitdown','pdf-tool','xlsx-tool','doc-diff','img-tool','docx-tool','pptx-tool','ical-tool']) {
    required.push(`resources/bin/${name}`)
  }
  const inventory: Record<string, { size: number, sha256: string }> = {}
  function record(file: string, key: string, allowEmpty = false) {
    const s = lstatSync(file)
    if (!s.isFile() || (!allowEmpty && s.size === 0)) throw new Error(`Required asset is not a nonempty real file: ${key}`)
    inventory[key] = { size: s.size, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') }
  }
  for (const name of required) record(join(electronDir, name), name)
  const worker = join(rootDir, 'packages/messaging-whatsapp-worker/dist/worker.cjs')
  record(worker, 'extraResources/messaging-whatsapp-worker/worker.cjs')

  for (const dir of ['docs','themes','permissions','tool-icons','scripts','release-notes']) {
    const assetDir = join(electronDir, 'dist/resources', dir)
    if (!existsSync(assetDir) || !readdirSync(assetDir).length) throw new Error(`Required resource directory missing/empty: ${dir}`)
    function walk(folder: string, key: string) {
      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        const file = join(folder,entry.name)
        const assetKey = `${key}/${entry.name}`
        if (entry.isDirectory()) walk(file,assetKey)
        else record(file,assetKey,true)
      }
    }
    walk(assetDir,`dist/resources/${dir}`)
  }
  for (const name of ['vendor/bun/bun','resources/bin/linux-x64/uv','node_modules/@anthropic-ai/claude-agent-sdk-binary/claude','node_modules/@vscode/ripgrep/bin/rg']) {
    const file = join(electronDir,name)
    if (!(lstatSync(file).mode & 0o111)) throw new Error(`Required binary is not executable: ${name}`)
    if (!readFileSync(file).subarray(0,4).equals(Buffer.from([0x7f,0x45,0x4c,0x46]))) throw new Error(`Required binary is not ELF: ${name}`)
  }
  writeFileSync(join(rootDir,'../evidence/staged-assets.json'), JSON.stringify(inventory,null,2)+'\n')
  console.log(`STAGED_ASSETS_VERIFIED=${Object.keys(inventory).length}`)
}
