import { reactive, toRefs } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouteUpdate } from '@/types/routeUpdate'
import { Writable } from '@/types/utilities'

const isRouterRouteSymbol = Symbol('isRouterRouteSymbol')

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = Readonly<{
  name: TRoute['name'],
  matched: TRoute['matched'],
  matches: TRoute['matches'],
  state: TRoute['state'],
  query: ResolvedRouteQuery,
  hash: TRoute['hash'],
  params: Writable<TRoute['params']>,
  update: RouteUpdate<TRoute>,
}>

export function isRouterRoute(value: unknown): value is RouterRoute {
  return typeof value === 'object' && value !== null && isRouterRouteSymbol in value
}

export function createRouterRoute<TRoute extends ResolvedRoute>(route: TRoute, push: RouterPush): RouterRoute<TRoute> {
  function update(nameOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions: any, maybeOptions?: RouterPushOptions): Promise<void> {
    if (typeof nameOrParams === 'object') {
      const params = {
        ...route.params,
        ...nameOrParams,
      }

      return push(route.name, params, valueOrOptions)
    }

    const params = {
      ...route.params,
      [nameOrParams]: valueOrOptions,
    }

    return push(route.name, params, maybeOptions)
  }

  const { matched, matches, name, query, params, state, hash } = toRefs(route)

  const routerRoute: RouterRoute<TRoute> = reactive({
    matched,
    matches,
    state,
    query,
    hash,
    params,
    name,
    update,
    [isRouterRouteSymbol]: true,
  })

  return new Proxy(routerRoute, {
    get: (target, property, receiver) => {
      if (property === 'params') {
        return new Proxy(route.params, {
          set(_target, property, value) {
            update(property, value)

            return true
          },
        })
      }

      if (property === 'state') {
        return new Proxy(route.state, {
          set(_target, property, value) {
            update({}, { state: { ...route.state, [property]: value } })

            return true
          },
        })
      }

      return Reflect.get(target, property, receiver)
    },
  })
}