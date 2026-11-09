import { getComputations } from '@/services/getComputations'
import { getRouteTitle } from '@/services/getRouteTitle'
import { getDataKey } from '@/services/getDataKey'
import { ResolvedRoute } from '@/types/resolved'
import { ValueLocation } from '@/types/computation'

/**
 * Evaluates an explicit title read outside navigation, computing dependencies only when requested.
 */
export function resolveRouteTitle(route: ResolvedRoute): Promise<string | undefined> {
  const computations = getComputations(route)
  const values = new Map<string, Promise<unknown>>()
  const { signal } = new AbortController()

  function getValue(location: ValueLocation): Promise<unknown> {
    const key = getDataKey({ ...location, route })
    const existing = values.get(key)

    if (existing) {
      return existing
    }

    const computation = computations.find((computation) => computation.key === key)

    if (!computation) {
      return Promise.reject(new TypeError(`No computation for ${location.kind} "${location.name}"`))
    }

    const value = Promise.resolve().then(() => computation.run({ to: route, signal, getValue }))
    values.set(key, value)

    return value
  }

  return getRouteTitle(route, getValue)
}
