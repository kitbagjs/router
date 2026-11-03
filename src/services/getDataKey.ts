import { ResolvedRoute } from '@/types/resolved'
import { setStateValues } from '@/services/state'

/**
 * What a stored value is: the props of a view, or the data of a loader. Part of the key so that a view
 * and a loader sharing a name on the same route are still two values.
 */
export type DataKind = 'props' | 'loader'

export function getDataKey(kind: DataKind, id: string, name: string, route: ResolvedRoute): string {
  const params = Object.fromEntries(route.matches.flatMap((match) => Object.entries(match.state ?? {})))
  const state = setStateValues(params, route.state)
  const stateEntries = Object.keys(state).sort()
    .map((key) => [key, state[key]])
  let location: number | string = route.matches.findIndex((match) => match.id === id)

  if (location === -1) {
    // Unattached loaders have a runtime identity and are not included in route payloads.
    location = id
  }

  return JSON.stringify([route.name, route.href, stateEntries, location, kind, name])
}
