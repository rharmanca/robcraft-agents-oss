import assert from 'node:assert/strict'
import { mock } from 'bun:test'
import * as os from 'node:os'
import * as fs from 'node:fs'

// Execute the real startup module with synthetic OS identity and Electron/filesystem
// adapters. Nothing here starts Electron or writes a real application-state folder.
const reject = process.argv[2] === 'reject-identity'
const calls: Array<[string, string]> = []
const directories: string[] = []
mock.module('electron', () => ({ app: {
  setName(name: string) { calls.push(['name',name]) },
  setPath(name: string, value: string) { calls.push([name,value]) },
}}))
mock.module('node:os', () => ({ ...os,
  homedir: () => '/home/crafttrial',
  userInfo: () => ({ username: reject ? 'synthetic-other-user' : 'crafttrial' }),
}))
mock.module('node:fs', () => ({ ...fs,
  mkdirSync(path: string) { directories.push(path) },
}))
Object.assign(process.env, {
  CRAFT_SERVER_URL: 'https://example.invalid', CRAFT_SERVER_TOKEN: 'synthetic-fixture',
  CRAFT_CONFIG_DIR: '/synthetic/legacy', CRAFT_HEADLESS: '1',
  AWS_ACCESS_KEY_ID: 'synthetic-fixture', OPENAI_API_KEY: 'synthetic-fixture',
  NODE_OPTIONS: 'synthetic-fixture', XDG_CONFIG_HOME: '/synthetic/foreign-config',
})
if (reject) {
  await assert.rejects(import('../apps/electron/src/main/trial-bootstrap'), /crafttrial identity/)
  assert.equal(calls.length,0)
  assert.equal(directories.length,0)
  console.log('BOOTSTRAP_REJECT_IDENTITY_PASS: no application/path/filesystem action')
} else {
  await import('../apps/electron/src/main/trial-bootstrap')
  assert.deepEqual(calls, [
    ['name','RobCraft Trial'],
    ['userData','/home/crafttrial/.config/robcraft-trial/electron'],
    ['sessionData','/home/crafttrial/.config/robcraft-trial/electron'],
  ])
  assert.deepEqual(directories, [
    '/home/crafttrial/.config/robcraft-trial/electron',
    '/home/crafttrial/.cache/robcraft-trial/tmp',
  ])
  assert.equal(process.env.CRAFT_CONFIG_DIR,'/home/crafttrial/.local/share/robcraft-trial/craft')
  assert.equal(process.env.CRAFT_RPC_HOST,'127.0.0.1')
  assert.equal(process.env.CRAFT_RPC_PORT,'0')
  assert.equal(process.env.XDG_CONFIG_HOME,'/home/crafttrial/.config')
  for (const name of ['CRAFT_SERVER_URL','CRAFT_SERVER_TOKEN','CRAFT_HEADLESS','AWS_ACCESS_KEY_ID','OPENAI_API_KEY','NODE_OPTIONS']) {
    assert.equal(process.env[name],undefined)
  }
  console.log('BOOTSTRAP_ACCEPT_PASS: real module; separate Electron paths; inherited controls/credentials removed; loopback defaults; mocked filesystem; no app launch')
}
