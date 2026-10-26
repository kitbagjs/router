import { ResolvedRoute } from '@/types/resolved'

type RouteIdentity = Pick<ResolvedRoute, 'id' | 'href'>

export function isSameResolvedRoute(route: RouteIdentity | undefined, other: RouteIdentity | undefined): boolean {
  return route?.id === other?.id && route?.href === other?.href
}
