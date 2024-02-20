import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { Route } from '@/types/routes'

export type ResolvedRoute = {
  matched: Route,
  matches: Route[],
  name: string,
  query: ResolvedRouteQuery,
  params: Record<string, unknown>,
}