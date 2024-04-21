import { readonly } from 'vue'
import { ResolvedRoute, ResolvedRouteSource } from '@/types/resolved'

export function createResolvedRoute(route: ResolvedRouteSource): ResolvedRoute {
  const restricted = readonly(route)

  return new Proxy(restricted, {
    get(target, prop, receiver) {
      if (prop === 'params') {
        return route.params
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}