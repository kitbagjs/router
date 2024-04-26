import { readonly } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { RouteUpdate, RouteUpdateOptions, RouterUpdate } from '@/types/routerUpdate'

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = Omit<ResolvedRoute, 'params'> & Readonly<{
  params: { -readonly [P in keyof TRoute['params']]: TRoute['params'][P] },
  update: RouteUpdate<TRoute>,
}>

export function createRouterRoute<TRoute extends ResolvedRoute>(route: TRoute, update: RouterUpdate): RouterRoute<TRoute> {
  function routeUpdate(keyOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions: any, maybeOptions?: RouteUpdateOptions): Promise<void> {
    if (typeof keyOrParams === 'object') {
      return update(route, keyOrParams, valueOrOptions)
    }

    const updatedParams = readonly({
      ...route.params,
      [keyOrParams]: valueOrOptions,
    })
    return update(route, updatedParams, maybeOptions)
  }

  return new Proxy(route as RouterRoute, {
    get: (target, prop, receiver) => {
      if (prop === 'update') {
        return routeUpdate
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}