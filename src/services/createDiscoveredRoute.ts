import { Route } from '@/types/route'

export const isDiscoveredRouteSymbol = Symbol('isDiscoveredRouteSymbol')

export type DiscoveredRoute = Route & {
  [isDiscoveredRouteSymbol]: true,
}

export function createDiscoveredRoute(route: Route): DiscoveredRoute {
  return {
    ...route,
    [isDiscoveredRouteSymbol]: true,
  }
}

export function isDiscoveredRoute(value: unknown): value is DiscoveredRoute {
  return typeof value === 'object' && value !== null && isDiscoveredRouteSymbol in value
}
