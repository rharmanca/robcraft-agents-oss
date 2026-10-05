#!/usr/bin/node
'use strict';
// Exercises actual normal bootstrap against synthetic Electron/filesystem/identity modules.
// No real app launch, credentials, user state or network writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = '/home/crafttrial/builds/robcraft-full-0.14.0-rob.1/source';
assert.equal(process.cwd(), root);
const esbuild = require(path.join(root, 'node_modules/esbuild'));
const yaml = require(path.join(root, 'node_modules/js-yaml'));
const compiled = esbuild.buildSync({entryPoints: [path.join(root, 'apps/electron/src/main/robcraft-bootstrap.ts')], bundle:true, platform:'node', format:'cjs', external:['electron'], write:false, logLevel:'silent'}).outputFiles[0].text;
function run(uid, home, username) {
  const env = {HOME:home, USER:username, DISPLAY:':2', NODE_OPTIONS:'SYNTHETIC_ONLY', ANTHROPIC_API_KEY:'SYNTHETIC_ONLY', CRAFT_SERVER_URL:'https://synthetic.invalid', CRAFT_CONFIG_DIR:'/synthetic/foreign'};
  const observed = {writes:[], names:[], paths:{}};
  const modules = {'electron':{app:{setName:n=>observed.names.push(n), setPath:(k,v)=>observed.paths[k]=v}}, 'node:fs':{mkdirSync:(p,o)=>observed.writes.push({p,o})}, 'node:os':{homedir:()=>home, userInfo:()=>({username,uid})}, 'node:path':path};
  const context = {process:{env,getuid:()=>uid}, require:(name)=>{assert.ok(Object.hasOwn(modules,name),'Unexpected bootstrap import: '+name); return modules[name];}, exports:{}, module:{exports:{}}};
  vm.runInNewContext(compiled, context, {timeout:2000});
  return {env, observed};
}
let passed = 0;
for (const [home,name] of [['/home/velocirobtor','velocirobtor'],['/home/synthetic-desktop','synthetic-desktop']]) {
  const {env,observed} = run(1000,home,name);
  assert.equal(env.HOME,home); assert.equal(env.USER,name);
  assert.equal(env.CRAFT_CONFIG_DIR,path.join(home,'.local/share/robcraft'));
  assert.equal(observed.paths.userData,path.join(home,'.config/robcraft'));
  assert.equal(observed.paths.sessionData,observed.paths.userData);
  assert.deepEqual(observed.names,['RobCraft']);
  assert.equal(env.CRAFT_DEEPLINK_SCHEME,'craftagents');
  assert.equal(env.CRAFT_RPC_HOST,'127.0.0.1'); assert.equal(env.CRAFT_RPC_PORT,'0');
  for (const key of ['NODE_OPTIONS','ANTHROPIC_API_KEY','CRAFT_SERVER_URL']) assert.equal(env[key],undefined);
  assert.ok(observed.writes.every(({p,o})=>p.startsWith(home+'/') && o.mode===0o700));
  passed++;
}
assert.throws(()=>run(0,'/root','root'),/must not run as root/); passed++;
const builder = yaml.load(fs.readFileSync(path.join(root,'apps/electron/electron-builder.yml'),'utf8'));
assert.equal(builder.appId,'dev.robweb.robcraft'); assert.equal(builder.productName,'RobCraft');
assert.equal(builder.extraMetadata.name,'robcraft'); assert.equal(builder.extraMetadata.version,'0.14.0-rob.1');
assert.deepEqual(builder.appImage.executableArgs,['--ozone-platform=x11']); assert.equal(builder.publish,null);
assert.ok(builder.linux.files.includes('dist/**/*') && builder.linux.files.includes('!**/*.map'));
assert.deepEqual(builder.protocols[0].schemes,['craftagents']); passed++;
const index = fs.readFileSync(path.join(root,'apps/electron/src/main/index.ts'),'utf8');
assert.match(index,/import '\.\/robcraft-bootstrap'/); assert.doesNotMatch(index,/import '\.\/trial-bootstrap'/);
assert.match(index,/setAsDefaultProtocolClient/); passed++;
const deep = fs.readFileSync(path.join(root,'apps/electron/src/main/deep-link.ts'),'utf8');
assert.doesNotMatch(deep,/trialDeepLinksDisabled/); assert.match(deep,/parsed\.protocol !== 'craftagents:'/); passed++;
const storage = fs.readFileSync(path.join(root,'packages/shared/src/credentials/backends/secure-storage.ts'),'utf8');
const workspaces = fs.readFileSync(path.join(root,'packages/shared/src/workspaces/storage.ts'),'utf8');
assert.doesNotMatch(storage,/migrateCredentialsIfNeeded/); assert.doesNotMatch(workspaces,/migrateWorkspacesIfNeeded/); passed++;
for (const rel of ['packages/shared/src/config/paths.ts','packages/shared/src/interceptor-common.ts','packages/session-tools-core/src/handlers/config-validate.ts']) assert.doesNotMatch(fs.readFileSync(path.join(root,rel),'utf8'),/robcraft-trial/);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'bun.lock'))).digest('hex'),'50a9c1afa74b700b954bc580e08c907dea0b1dd3021cb7b2f7d2ce678a1aedb0'); passed++;
console.log(JSON.stringify({status:'normal-bootstrap-and-package-policy-pass',checks:passed,fixture_only:true,real_app_launched:false,real_state_created:false}));
