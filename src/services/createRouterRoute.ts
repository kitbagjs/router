import { ResolvedRoute } from '@/types/resolved'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouteUpdate } from '@/types/routeUpdate'
import { Writable } from '@/types/utilities'

const isRouterRouteSymbol = Symbol('isRouterRouteSymbol')

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = Readonly<{
  key: TRoute['key'],
  matched: TRoute['matched'],
  matches: TRoute['matches'],
  query: ResolvedRouteQuery,
  params: Writable<TRoute['params']>,
  update: RouteUpdate<TRoute>,
  [isRouterRouteSymbol]: true,
}>

export function isRouterRoute(value: unknown): value is RouterRoute {
  return typeof value === 'object' && value !== null && isRouterRouteSymbol in value && value[isRouterRouteSymbol] === true
}

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
    has: (target, property) => {
      if (['update', 'params', isRouterRouteSymbol].includes(property)) {
        return true
      }

      return Reflect.has(target, property)
    },
    get: (target, property, receiver) => {
      if (property === isRouterRouteSymbol) {
        return true
      }

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