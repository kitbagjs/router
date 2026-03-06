import { computed, InjectionKey, reactive, toRefs } from 'vue'
import { parseUrl, stringifyUrl, updateUrl } from '@/services/urlParser'
import { ResolvedRoute } from '@/types/resolved'
import { RouterRoute } from '@/types/routerRoute'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { QuerySource } from '@/types/querySource'
import { Router } from '@/types/router'
import { isPropertyKey } from '@/utilities/guards'

const isRouterRouteSymbol = Symbol('isRouterRouteSymbol')

export function isRouterRoute(routerKey: InjectionKey<Router>, value: unknown): value is RouterRoute {
  return typeof value === 'object' && value !== null && isRouterRouteSymbol in value && routerKey in value
}

export function createRouterRoute<TRoute extends ResolvedRoute>(routerKey: InjectionKey<Router>, route: TRoute, push: RouterPush): RouterRoute<TRoute> {
  function updateQuery(query: QuerySource): void {
    const routeWithoutQuery = stringifyUrl({
      ...parseUrl(route.href),
      query: undefined,
    })
    const updatedHref = updateUrl(routeWithoutQuery, { query })

    push(updatedHref)
  }

  function update(individualParamNameOrAllParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions?: any, maybeOptions?: RouterPushOptions): Promise<void> {
    if (isPropertyKey(individualParamNameOrAllParams)) {
      return update({ [individualParamNameOrAllParams]: valueOrOptions }, maybeOptions)
    }

    const paramUpdates = individualParamNameOrAllParams
    const options = valueOrOptions
    const params = {
      ...route.params,
      ...paramUpdates,
    }

    return push(route.name, params, options)
  }

  const querySet: URLSearchParams['set'] = (...parameters) => {
    const query = new URLSearchParams(route.query)
    query.set(...parameters)

    updateQuery(query)
  }

  const queryAppend: URLSearchParams['append'] = (...parameters) => {
    const query = new URLSearchParams(route.query)
    query.append(...parameters)

    updateQuery(query)
  }

  const queryDelete: URLSearchParams['delete'] = (...parameters) => {
    const query = new URLSearchParams(route.query)
    query.delete(...parameters)

    updateQuery(query)
  }

  const { id, matched, matches, hooks, name, hash, href, getTitle } = toRefs(route)

  const paramsProxy = new Proxy({}, {
    get(_target, property, receiver) {
      return Reflect.get(route.params, property, receiver)
    },
    set(_target, property, value) {
      update(property, value)

      return true
    },
    ownKeys() {
      return Reflect.ownKeys(route.params)
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(route.params, prop)
    },
  })

  const params = computed({
    get() {
      return paramsProxy
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
      updateQuery(query)
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
    getTitle,
    update,
    [isRouterRouteSymbol]: true,
    [routerKey]: true,
  })

  return routerRoute
}
