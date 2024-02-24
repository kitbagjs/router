import { RouterRoute, isNamedRoute } from '@/types'

export function getRoutePath(route: RouterRoute): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}