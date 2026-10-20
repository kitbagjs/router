import { computed, InjectionKey, reactive, shallowRef } from 'vue'
import { parseUrl, stringifyUrl, updateUrl } from '@/services/urlParser'
import { ResolvedRoute } from '@/types/resolved'
import { IS_ROUTER_ROUTE_SYMBOL, RouterRoute, RouterRouteInternal } from '@/types/routerRoute'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { QuerySource } from '@/types/querySource'
import { Router } from '@/types/router'
import { RouteValueStore } from '@/services/createRouteValueStore'
import { isPropertyKey } from '@/utilities/guards'

export function isRouterRoute(routerKey: InjectionKey<Router>, value: unknown): value is RouterRoute & RouterRouteInternal {
  return typeof value === 'object' && value !== null && IS_ROUTER_ROUTE_SYMBOL in value && routerKey in value
}

type CreateRouterRouteOptions<TRouter extends Router = Router> = {
  routerKey: InjectionKey<TRouter>,
  route: ResolvedRoute,
  push: RouterPush,
  getData: RouteValueStore['getData'],
}

export function createRouterRoute<TRouter extends Router>(options: CreateRouterRouteOptions<TRouter>): TRouter['route'] & RouterRouteInternal
export function createRouterRoute({ routerKey, route: initialRoute, push, getData }: CreateRouterRouteOptions): RouterRoute & RouterRouteInternal {
  const route = shallowRef(initialRoute)

  function getResolvedRoute(): ResolvedRoute {
    return route.value
  }

  function updateRoute(newRoute: ResolvedRoute): void {
    route.value = newRoute
  }

  function updateQuery(query: QuerySource): void {
    const routeWithoutQuery = stringifyUrl({
      ...parseUrl(route.value.href),
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
      ...route.value.params,
      ...paramUpdates,
    }

    return push(route.value.name, params, options)
  }

  const querySet: URLSearchParams['set'] = (...parameters) => {
    const query = new URLSearchParams(route.value.query)
    query.set(...parameters)

    updateQuery(query)
  }

  const queryAppend: URLSearchParams['append'] = (...parameters) => {
    const query = new URLSearchParams(route.value.query)
    query.append(...parameters)

    updateQuery(query)
  }

  const queryDelete: URLSearchParams['delete'] = (...parameters) => {
    const query = new URLSearchParams(route.value.query)
    query.delete(...parameters)

    updateQuery(query)
  }

  const id = computed(() => route.value.id)
  const matched = computed(() => route.value.matched)
  const matches = computed(() => route.value.matches)
  const name = computed(() => route.value.name)
  const hash = computed(() => route.value.hash)
  const href = computed(() => route.value.href)
  const canonical = computed(() => route.value.canonical)
  const data = computed(() => getData(route.value))
  const getTitle = computed(() => route.value.getTitle)

  const paramsProxy = new Proxy({}, {
    get(_target, property, receiver) {
      return Reflect.get(route.value.params, property, receiver)
    },
    set(_target, property, value) {
      update(property, value)

      return true
    },
    ownKeys() {
      return Reflect.ownKeys(route.value.params)
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(route.value.params, prop)
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
      return new Proxy<URLSearchParams>(route.value.query, {
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
      return new Proxy(route.value.state, {
        set(_target, property, value) {
          update({}, { state: { ...route.value.state, [property]: value } })

          return true
        },
      })
    },
    set(state) {
      update({}, { state })
    },
  })

  const internal = {
    [IS_ROUTER_ROUTE_SYMBOL]: true,
    [routerKey]: true,
    updateRoute,
    getResolvedRoute,
  } satisfies RouterRouteInternal

  // data is derived from the route's matches rather than read off the route, so its type cannot be matched here
  const routerRoute = reactive({
    ...initialRoute,
    ...internal,
    id,
    matched,
    matches,
    state,
    query,
    hash,
    params,
    name,
    href,
    canonical,
    data,
    getTitle,
    update,
  }) as RouterRoute & RouterRouteInternal

  return routerRoute
}
