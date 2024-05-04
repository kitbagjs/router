import { ResolvedRoute } from '@/types/resolved'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouteUpdate } from '@/types/routeUpdate'
import { Writable } from '@/types/utilities'

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = Omit<ResolvedRoute, 'params'> & Readonly<{
  params: Writable<TRoute['params']>,
  update: RouteUpdate<TRoute>,
}>

export function createRouterRoute<TRoute extends ResolvedRoute>(route: TRoute, push: RouterPush): RouterRoute<TRoute> {
  function update(keyOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions: any, maybeOptions?: RouterPushOptions): Promise<void> {
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
    get: (target, property, receiver) => {
      if (property === 'update') {
        return update
      }

      if (property === 'params') {
        return new Proxy(route.params, {
          set(_target, property, value) {
            update(property, value)

            return true
          },
        })
      }

      return Reflect.get(target, property, receiver)
    },
  })
}