/**
 * Shared Model ID Maps
 *
 * Centralized mappings between different model ID formats.
 * Must stay in sync — do not edit these directly without propagating changes.
 */

/**
 * Reverse map: all known Bedrock ID variants → bare Anthropic ID.
 * Includes US, EU, global inference profiles and base IDs.
 *
 * Source: Pi SDK registry (models.generated.js)
 */
export const BEDROCK_TO_BARE: Record<string, string> = {
  // US inference profiles
  'us.anthropic.claude-opus-4-7': 'claude-opus-4-7',
  'us.anthropic.claude-opus-4-6-v1': 'claude-opus-4-6',
  'us.anthropic.claude-sonnet-4-6': 'claude-sonnet-4-6',
  'us.anthropic.claude-haiku-4-5-20251001-v1:0': 'claude-haiku-4-5-20251001',
  'us.anthropic.claude-opus-4-5-20251101-v1:0': 'claude-opus-4-5-20251101',
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0': 'claude-sonnet-4-5-20250929',
  // EU inference profiles
  'eu.anthropic.claude-opus-4-7': 'claude-opus-4-7',
  'eu.anthropic.claude-opus-4-6-v1': 'claude-opus-4-6',
  'eu.anthropic.claude-sonnet-4-6': 'claude-sonnet-4-6',
  'eu.anthropic.claude-haiku-4-5-20251001-v1:0': 'claude-haiku-4-5-20251001',
  'eu.anthropic.claude-opus-4-5-20251101-v1:0': 'claude-opus-4-5-20251101',
  'eu.anthropic.claude-sonnet-4-5-20250929-v1:0': 'claude-sonnet-4-5-20250929',
  // Global inference profiles
  'global.anthropic.claude-opus-4-7': 'claude-opus-4-7',
  'global.anthropic.claude-opus-4-6-v1': 'claude-opus-4-6',
  'global.anthropic.claude-sonnet-4-6': 'claude-sonnet-4-6',
  'global.anthropic.claude-haiku-4-5-20251001-v1:0': 'claude-haiku-4-5-20251001',
  // Base IDs (no region prefix)
  'anthropic.claude-opus-4-7': 'claude-opus-4-7',
  'anthropic.claude-opus-4-6-v1': 'claude-opus-4-6',
  'anthropic.claude-sonnet-4-6': 'claude-sonnet-4-6',
  'anthropic.claude-haiku-4-5-20251001-v1:0': 'claude-haiku-4-5-20251001',
  'anthropic.claude-opus-4-5-20251101-v1:0': 'claude-opus-4-5-20251101',
  'anthropic.claude-sonnet-4-5-20250929-v1:0': 'claude-sonnet-4-5-20250929',
};
