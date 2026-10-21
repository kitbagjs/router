import { computed, InjectionKey, reactive, shallowReactive, shallowRef } from 'vue'
import { parseUrl, stringifyUrl, updateUrl } from '@/services/urlParser'
import { ResolvedRoute } from '@/types/resolved'
import { IS_ROUTER_ROUTE_SYMBOL, RouterRoute, RouterRouteInternal } from '@/types/routerRoute'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { QuerySource } from '@/types/querySource'
import { Router } from '@/types/router'
import { Navigation } from '@/services/createNavigation'
import { isPropertyKey } from '@/utilities/guards'

export function isRouterRoute(routerKey: InjectionKey<Router>, value: unknown): value is RouterRoute & RouterRouteInternal {
  return typeof value === 'object' && value !== null && IS_ROUTER_ROUTE_SYMBOL in value && routerKey in value
}

type CreateRouterRouteOptions<TRouter extends Router = Router> = {
  routerKey: InjectionKey<TRouter>,
  route: ResolvedRoute,
  push: RouterPush,
  getRouteData: Navigation['getRouteData'],
}

export function createRouterRoute<TRouter extends Router>(options: CreateRouterRouteOptions<TRouter>): TRouter['route'] & RouterRouteInternal
export function createRouterRoute({ routerKey, route: initialRoute, push, getRouteData }: CreateRouterRouteOptions): RouterRoute & RouterRouteInternal {
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

  const querySort: URLSearchParams['sort'] = () => {
    const query = new URLSearchParams(route.value.query)
    query.sort()

    updateQuery(query)
  }

  const id = computed(() => route.value.id)
  const matched = computed(() => route.value.matched)
  const matches = computed(() => route.value.matches)
  const name = computed(() => route.value.name)
  const hash = computed(() => route.value.hash)
  const href = computed(() => route.value.href)
  const canonical = computed(() => route.value.canonical)
  const data = computed(() => getRouteData(route.value))
  const getTitle = computed(() => route.value.getTitle)
  const loaders = computed(() => {
    const entries = route.value.matches.flatMap((match) => Object.entries(match.loaders))

    return Object.fromEntries(entries)
  })

  const paramsProxy = shallowReactive(new Proxy({}, {
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
  }))

  const params = computed({
    get() {
      return paramsProxy
    },
    set(params) {
      update(params)
    },
  })

  const queryProxy = new Proxy(route.value.query, {
    get(_target, property) {
      switch (property) {
        case 'append':
          return queryAppend
        case 'set':
          return querySet
        case 'delete':
          return queryDelete
        case 'sort':
          return querySort
        default: {
          const query = route.value.query
          const value = Reflect.get(query, property, query)

          if (typeof value === 'function' && property !== 'constructor') {
            return (...args: unknown[]) => {
              const query = route.value.query

              return Reflect.apply(Reflect.get(query, property, query), query, args)
            }
          }

          return value
        }
      }
    },
  })

  const query = computed({
    get() {
      return queryProxy
    },
    set(query: QuerySource) {
      updateQuery(query)
    },
  })

  const stateProxy = shallowReactive(new Proxy({}, {
    get(_target, property, receiver) {
      return Reflect.get(route.value.state, property, receiver)
    },
    set(_target, property, value) {
      update({}, { state: { ...route.value.state, [property]: value } })

      return true
    },
    has(_target, property) {
      return Reflect.has(route.value.state, property)
    },
    ownKeys() {
      return Reflect.ownKeys(route.value.state)
    },
    getOwnPropertyDescriptor(_target, property) {
      return Reflect.getOwnPropertyDescriptor(route.value.state, property)
    },
  }))

  const state = computed({
    get() {
      return stateProxy
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
    ...internal,
    loaders,
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
