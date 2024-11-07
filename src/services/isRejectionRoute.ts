import { ResolvedRoute } from '@/types/resolved'

export const isRejectionRouteSymbol = Symbol()

export function isRejectionRoute(route: ResolvedRoute): boolean {
  return isRejectionRouteSymbol in route && !!route[isRejectionRouteSymbol]
}
