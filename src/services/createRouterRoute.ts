import { reactive, toRefs } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouteUpdate } from '@/types/routeUpdate'
import { QuerySource } from '@/types/query'

const isRouterRouteSymbol = Symbol('isRouterRouteSymbol')

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = {
  readonly id: TRoute['id'],
  readonly name: TRoute['name'],
  readonly matched: TRoute['matched'],
  readonly matches: TRoute['matches'],
  readonly state: TRoute['state'],
  readonly hash: TRoute['hash'],
  readonly update: RouteUpdate<TRoute>,

  params: TRoute['params'],

  get query(): ResolvedRouteQuery,
  set query(value: QuerySource),
}

export function isRouterRoute(value: unknown): value is RouterRoute {
  return typeof value === 'object' && value !== null && isRouterRouteSymbol in value
}

export function createRouterRoute<TRoute extends ResolvedRoute>(route: TRoute, push: RouterPush): RouterRoute<TRoute> {
  function update(nameOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions?: any, maybeOptions?: RouterPushOptions): Promise<void> {
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

  const querySet: URLSearchParams['set'] = (...parameters) => {
    const query = new URLSearchParams(route.query.toString())
    query.set(...parameters)

    update({}, { query })
  }

  const queryAppend: URLSearchParams['append'] = (...parameters) => {
    const query = new URLSearchParams(route.query.toString())
    query.append(...parameters)

    update({}, { query })
  }

  const queryDelete: URLSearchParams['delete'] = (...parameters) => {
    const query = new URLSearchParams(route.query.toString())
    query.delete(...parameters)

    update({}, { query })
  }

  const { id, matched, matches, name, query, params, state, hash } = toRefs(route)

  const routerRoute: RouterRoute<TRoute> = reactive({
    id,
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

      if (property === 'query') {
        return new Proxy(route.query, {
          get(_target, property, receiver) {
            switch (property) {
              case 'append':
                return queryAppend
              case 'set':
                return querySet
              case 'delete':
                return queryDelete
              default:
                return Reflect.get(_target, property, receiver)
            }
          },
        })
      }

      return Reflect.get(target, property, receiver)
    },

    set(target, property, value, receiver) {
      if (property === 'params') {
        update(value)

        return true
      }

      if (property === 'query') {
        update({}, { query: value })

        return true
      }

      return Reflect.set(target, property, value, receiver)
    },
  })
}
