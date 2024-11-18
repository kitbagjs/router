import { computed, reactive, toRefs } from 'vue'
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
  readonly hash: TRoute['hash'],
  readonly update: RouteUpdate<TRoute>,

  params: TRoute['params'],
  state: TRoute['state'],

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

  const { id, matched, matches, name, hash } = toRefs(route)

  const params = computed({
    get() {
      return new Proxy(route.params, {
        set(_target, property, value) {
          update(property, value)

          return true
        },
      })
    },
    set(params) {
      update(params)
    },
  })

  const query = computed({
    get() {
      return new Proxy<ResolvedRouteQuery>(route.query, {
        get(target, property, receiver) {
          switch (property) {
            case 'append':
              return queryAppend
            case 'set':
              return querySet
            case 'delete':
              return queryDelete
            default:
              return Reflect.get(target, property, receiver)
          }
        },
      })
    },
    set(query: QuerySource) {
      update({}, { query })
    },
  })

  const state = computed({
    get() {
      return new Proxy(route.state, {
        set(_target, property, value) {
          update({}, { state: { ...route.state, [property]: value } })

          return true
        },
      })
    },
    set(state) {
      update({}, { state })
    },
  })

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

  return routerRoute
}
