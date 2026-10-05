/**
 * RobCraft has no updater instance, feed, cache watcher, or install hook.
 * Keep the existing RPC interface so the UI reports the disabled policy without
 * loading electron-updater. Only a separately reviewed local artifact may replace it.
 */
import { getAppVersion } from '@craft-agent/shared/version'
import type { UpdateInfo } from '../shared/types'
import type { EventSink } from '@craft-agent/server-core/transport'

const DISABLED = 'Official updates are disabled for RobAgents; use a separately reviewed local build.'

interface CheckOptions { autoDownload?: boolean }
export interface UpdateOnLaunchResult {
  action: 'none' | 'skipped' | 'ready' | 'downloading'
  reason?: string
  version?: string | null
}

export function getUpdateInfo(): UpdateInfo {
  return {
    available: false,
    currentVersion: getAppVersion(),
    latestVersion: null,
    downloadState: 'idle',
    downloadProgress: 0,
    error: DISABLED,
  }
}

// Compatibility only: updater teardown callbacks must never execute in this build.
export function setBeforeUpdateQuitHook(_fn: () => void): void {}
export function setBeforeUpdateInstallHook(_fn: () => Promise<void>): void {}
export function setInstallQuitFailedHook(_fn: () => void): void {}
export function setAutoUpdateEventSink(_sink: EventSink): void {}
export function isUpdating(): boolean { return false }
export async function checkForUpdates(_options: CheckOptions = {}): Promise<UpdateInfo> {
  return getUpdateInfo()
}
export async function checkForUpdatesOnLaunch(): Promise<UpdateOnLaunchResult> {
  return { action: 'skipped', reason: DISABLED }
}
export async function installUpdate(): Promise<void> {
  throw new Error(DISABLED)
}
