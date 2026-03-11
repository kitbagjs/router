import { QuerySource } from '@/types/querySource'

/**
 * Merges two URLSearchParams: all entries from base, then from additional only
 * keys that are not already in base. Avoids duplicating keys when the same
 * param appears in both (e.g. route-defined query and URL query).
 */
export function combineUrlSearchParams(...paramGroups: (URLSearchParams | QuerySource)[]): URLSearchParams {
  const combinedParams = new URLSearchParams()

  for (const params of paramGroups) {
    const paramsToAdd = new URLSearchParams(params)
    const keysToAddFromThisGroup = new Set<string>()

    for (const key of paramsToAdd.keys()) {
      if (!combinedParams.has(key)) {
        keysToAddFromThisGroup.add(key)
      }
    }

    for (const [key, value] of paramsToAdd.entries()) {
      if (keysToAddFromThisGroup.has(key)) {
        combinedParams.append(key, value)
      }
    }
  }

  return combinedParams
}
