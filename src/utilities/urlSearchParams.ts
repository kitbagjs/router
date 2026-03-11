import { QuerySource } from '@/types/querySource'

/**
 * Merges two URLSearchParams: all entries from base, then from additional only
 * keys that are not already in base. Avoids duplicating keys when the same
 * param appears in both (e.g. route-defined query and URL query).
 */
export function combineUrlSearchParams(base: URLSearchParams | QuerySource, additional: URLSearchParams | QuerySource): URLSearchParams {
  const baseParams = new URLSearchParams(base)
  const additionalParams = new URLSearchParams(additional)
  const keysInBase = new Set(baseParams.keys())

  for (const [key, value] of additionalParams.entries()) {
    if (!keysInBase.has(key)) {
      baseParams.append(key, value)
    }
  }

  return baseParams
}
