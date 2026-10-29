# RobAgents server patch set

Four edits applied to the Craft Agents source tree after extraction and before
the image build. They are the reason a naive rebuild from this repo does not
reproduce the deployed server image.

## Why this exists

These edits were previously applied **by hand** to the extracted build tree.
They were not committed, not scripted, and not documented. `prepare.py` saved
pristine copies to `backups/<timestamp>/source-originals/` before touching
them, which is the only reason they were recoverable.

That was a real hazard: rebuilding from this repository without knowing about
these edits produces an image that behaves differently from the one in
production.

## The edits

| File | Change | Severity |
|---|---|---|
| `packages/server/src/index.ts` | stop printing the live server token to stdout | **security** |
| `apps/webui/src/index.html` | page title → RobAgents | branding |
| `apps/webui/src/login.html` | title, heading, labels → RobAgents / "Server Password" | branding |
| `apps/webui/vite.config.ts` | `sourcemap: true` → `false` | image size / no source maps |

### The security one matters most

Upstream logs the server credential:

```ts
console.log(`CRAFT_SERVER_TOKEN=${instance.token}`)
```

This is still present in upstream `v0.15.6` at `packages/server/src/index.ts`
line 315. Any build that omits this patch writes the live server token into
container logs, where `docker logs` exposes it.

`apply.py` refuses (exit 1) if that line is still present after patching, so a
silent regression is not possible.

## Usage

```bash
python3 patches/apply.py /path/to/extracted/source
```

- Idempotent: re-running on an already-patched tree succeeds without change.
- Exit 1 if the patch does not apply or the token-logging line survives.
- `prepare.py` calls this automatically; it is also safe to run standalone.

## Upgrading upstream

The patch is a unified diff against the 0.14.x source. On a new upstream
version:

1. Run `apply.py`. If it fails, upstream changed those lines.
2. Regenerate the diff from the new pristine source versus the intended edits.
3. Re-run the verification tests before building.

Only `packages/server/src/index.ts` is position-sensitive; the other three
anchor on stable HTML/config lines.
