import { readonly } from 'vue'
import { ReadonlyResolvedRoute, ResolvedRoute } from '@/types/resolved'

export function createReadonlyResolvedRoute(route: ResolvedRoute): ReadonlyResolvedRoute {
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