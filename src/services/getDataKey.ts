import { ResolvedRoute } from '@/types/resolved'
import { setStateValues } from '@/services/state'

/**
 * What a stored value is: the props of a view, or the data of a loader. Part of the key so that a view
 * and a loader sharing a name on the same route are still two values.
 */
export type DataKind = 'props' | 'loader'

export type GetDataKeyOptions = {
  /**
   * The resolved destination whose name, URL, and serialized state scope the stored value.
   * Depth, kind, and name must identify a computation within this destination.
   */
  route: ResolvedRoute,
  /**
   * The index of the owning route in `route.matches`, starting at zero for the root match.
   * Unattached loaders use -1 because they have no owning match.
   */
  depth: number,
  /**
   * Whether the value comes from the owning match's views (props) or loaders.
   */
  kind: DataKind,
  /**
   * The view name in `route.matches[depth].views`, or the loader name in
   * `route.matches[depth].loaders`. Unattached loaders use their runtime loader ID instead.
   */
  name: string,
}

/**
 * Identifies a computation for one resolved destination. Matched computations use the same key on
 * the server and client when their route hierarchy, destination, and serialized state agree.
 */
export function getDataKey({ kind, depth, name, route }: GetDataKeyOptions): string {
  const params = Object.fromEntries(route.matches.flatMap((match) => Object.entries(match.state ?? {})))
  const state = setStateValues(params, route.state)
  const stateEntries = Object.keys(state).sort()
    .map((key) => [key, state[key]])

  return JSON.stringify([route.name, route.href, stateEntries, depth, kind, name])
}
