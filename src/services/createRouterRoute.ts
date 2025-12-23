import { computed, InjectionKey, reactive, toRefs } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { RouterRoute } from '@/types/routerRoute'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { QuerySource } from '@/types/querySource'
import { Router } from '@/types/router'

const isRouterRouteSymbol = Symbol('isRouterRouteSymbol')

export function isRouterRoute(routerKey: InjectionKey<Router>, value: unknown): value is RouterRoute {
  return typeof value === 'object' && value !== null && isRouterRouteSymbol in value && routerKey in value
}

export function createRouterRoute<TRoute extends ResolvedRoute>(routerKey: InjectionKey<Router>, route: TRoute, push: RouterPush): RouterRoute<TRoute> {
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
    const query = new URLSearchParams(route.query)
    query.set(...parameters)

    update({}, { query })
  }

  const queryAppend: URLSearchParams['append'] = (...parameters) => {
    const query = new URLSearchParams(route.query)
    query.append(...parameters)

    update({}, { query })
  }

  const queryDelete: URLSearchParams['delete'] = (...parameters) => {
    const query = new URLSearchParams(route.query)
    query.delete(...parameters)

    update({}, { query })
  }

  const { id, matched, matches, hooks, name, hash, href } = toRefs(route)

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
      return new Proxy<URLSearchParams>(route.query, {
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
    hooks,
    state,
    query,
    hash,
    params,
    name,
    href,
    update,
    [isRouterRouteSymbol]: true,
    [routerKey]: true,
  })

  return routerRoute
}
