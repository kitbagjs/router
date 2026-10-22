import { ResolvedRoute } from '@/types/resolved'

/**
 * What a stored value is: the props of a view, or the data of a loader. Part of the key so that a view
 * and a loader sharing a name on the same route are still two values.
 */
export type DataKind = 'props' | 'loader'

export function getDataKey(kind: DataKind, id: string, name: string, route: ResolvedRoute): string {
  return [kind, id, name, route.id, route.href].join('-')
}
