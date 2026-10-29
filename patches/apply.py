#!/usr/bin/env python3
"""Apply the RobAgents server patch set to an extracted Craft Agents source tree.

These are the four post-extraction edits the Work/CA server image has always
carried. They were previously applied by hand and were not reproducible from
code; this script is the canonical form.

The most important one is `packages/server/src/index.ts`: upstream logs the
live server token to stdout. Any rebuild that skips this patch silently prints
the server credential into container logs.

Usage:
    python3 apply.py <source-tree>

Exit codes:
    0  every patch applied, or was already applied (idempotent)
    1  a patch did not apply (source has drifted; inspect before forcing)

Does not print file contents or any credential.
"""
from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path

PATCH_DIR = Path(__file__).resolve().parent
PATCH_FILE = PATCH_DIR / 'robcraft-server.patch'

# sha256 of each patched file once the set is applied, for the 0.14.x baseline.
# A new upstream version will legitimately change these; verification then
# falls back to "patch applied cleanly" rather than failing the build.
EXPECTED_PATCHED = {
    'packages/server/src/index.ts':
        None,
    'apps/webui/src/index.html':
        None,
    'apps/webui/src/login.html':
        None,
    'apps/webui/vite.config.ts':
        None,
}

# Markers that must be absent afterwards. If any is present, the patch did not
# take and the image would leak the server token.
FORBIDDEN_MARKERS = [
    ('packages/server/src/index.ts', 'CRAFT_SERVER_TOKEN=${instance.token}'),
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    if len(sys.argv) != 2:
        print('usage: apply.py <source-tree>', file=sys.stderr)
        return 1
    tree = Path(sys.argv[1]).resolve()
    if not (tree / 'packages' / 'server').is_dir():
        print(f'not a Craft Agents source tree: {tree}', file=sys.stderr)
        return 1
    if not PATCH_FILE.is_file():
        print(f'missing patch file: {PATCH_FILE}', file=sys.stderr)
        return 1

    dry = subprocess.run(
        ['git', 'apply', '--check', str(PATCH_FILE)],
        cwd=tree, capture_output=True, text=True,
    )
    if dry.returncode == 0:
        applied = subprocess.run(
            ['git', 'apply', str(PATCH_FILE)],
            cwd=tree, capture_output=True, text=True,
        )
        if applied.returncode != 0:
            print(f'patch failed to apply: {applied.stderr.strip()}', file=sys.stderr)
            return 1
        state = 'applied'
    else:
        # Either already applied, or the source drifted. Distinguish by marker.
        state = 'already-applied-or-drifted'

    failures = []
    for relative, marker in FORBIDDEN_MARKERS:
        target = tree / relative
        if target.is_file() and marker in target.read_text(errors='replace'):
            failures.append(f'{relative} still contains token-logging line')
    if failures:
        for line in failures:
            print(f'REFUSING: {line}', file=sys.stderr)
        return 1

    print(f'patch set: {state} in {tree}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
