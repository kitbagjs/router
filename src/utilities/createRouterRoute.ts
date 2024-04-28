import { RouterPush, RouterPushOptions, Writable } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { RouteUpdate } from '@/types/routeUpdate'

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = Omit<ResolvedRoute, 'params'> & Readonly<{
  params: Writable<TRoute['params']>,
  update: RouteUpdate<TRoute>,
}>

export function createRouterRoute<TRoute extends ResolvedRoute>(route: TRoute, push: RouterPush): RouterRoute<TRoute> {
  function routeUpdate(keyOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions: any, maybeOptions?: RouterPushOptions): Promise<void> {
    if (typeof keyOrParams === 'object') {
      const params = {
        ...route.params,
        ...keyOrParams,
      }

      return push(route.key, params, valueOrOptions)
    }

    const params = {
      ...route.params,
      [keyOrParams]: valueOrOptions,
    }

    return push(route.key, params, maybeOptions)
  }

  return new Proxy(route as RouterRoute<TRoute>, {
    get: (target, prop, receiver) => {
      if (prop === 'update') {
        return routeUpdate
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}