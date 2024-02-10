import { Route } from '@/types/routes'

export type InternalRoute = Route & {
  _internal: {
    key: symbol,
  },
}

export function isInternalRoute(route: Route): route is InternalRoute {
  return '_internal' in route
}