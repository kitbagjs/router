import { ResolvedRouteQuery } from '@/types/resolvedQuery'

export function createResolvedRouteQuery(query?: string): ResolvedRouteQuery {
  const params = new URLSearchParams(query)

  return {
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
  }
}