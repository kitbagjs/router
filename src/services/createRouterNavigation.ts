import { markRaw } from 'vue'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { DEFAULT_VIEW_NAME } from './routeViews'
import { DEFAULT_LOADER_NAME } from './addLoader'
import { ContextPushError } from '@/errors/contextPushError'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { createDataStore, DataStore } from './createDataStore'
import { DataKind, getDataKey } from './getDataKey'
import { PropsResult } from '@/utilities/props'
import { warn } from '@/utilities/warn'
import { MaybePromise } from '@/types/utilities'
import { isSameResolvedRoute } from '@/utilities/isSameResolvedRoute'
import { Computation, getComputations, isKind, loaderLocations, propsLocations, ValueLocation } from './getComputations'

/**
 * Computation stopped because its navigation was disposed.
 */
type RouterNavigationAbandoned = {
  status: 'ABANDONED',
}

export type RouterNavigationResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | RouterNavigationAbandoned

type RouterNavigationComputationResponse = {
  response: Promise<RouterNavigationResponse>,
  source: DataKind,
}

type RouterNavigationCommitOptions = {
  to: ResolvedRoute,
  from?: ResolvedRoute | null,
}

type RouterNavigationContext = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  signal: AbortSignal,
}

export type RouterNavigationResponseEvent = RouterNavigationComputationResponse & RouterNavigationContext

type CreateRouterNavigationOptions = {
  onResponse?: (response: RouterNavigationResponseEvent) => void,
}

type RouterNavigationState = {
  route: ResolvedRoute | undefined,
  responses: RouterNavigationComputationResponse[],
  context: RouterNavigationContext | undefined,
}

type RouterNavigationStoreSlots = {
  current: RouterNavigationStore,
  staged: RouterNavigationStore,
}

export type RouterNavigationStore = {
  data: DataStore,
  signal: AbortSignal,
  route: ResolvedRoute | undefined,
  /**
   * Disposes of the previously staged navigation and sets this navigation as staged.
   */
  stage: () => void,
  commit: (options: RouterNavigationCommitOptions) => Promise<unknown>[],
  abandon: () => void,
  dispose: () => void,
  /**
   * Computes the supplied values and reports how they settle.
   */
  compute: (route: ResolvedRoute, computations: Computation[]) => Promise<unknown>[],
  /**
   * Adopts values that already settled, in place of running their getters.
   */
  fill: (route: ResolvedRoute, values: RouteValue[]) => void,
}

/**
 * A value the store holds for a route: which computation it belongs to, and what it resolved to.
 */
export type RouteValue = {
  kind: DataKind,
  depth: number,
  name: string,
  value: unknown,
}

export type RouterNavigationStores = HasVueAppStore & {
  current: () => RouterNavigationStore,
  create: () => RouterNavigationStore,
  /**
   * The navigation prepared for the next commit.
   * The rendered route keeps reading from the current navigation until then.
   */
  staged: (route?: ResolvedRoute | null) => RouterNavigationStore,
  /**
   * Makes the staged navigation current and computes whatever the route still lacks.
   */
  commit: (options: RouterNavigationCommitOptions) => Promise<unknown>[],
  /**
   * The values currently settled in the store.
   */
  getValues: (route: ResolvedRoute) => RouteValue[],
  getProps: (id: string, name: string, route: ResolvedRoute) => MaybePromise<PropsResult>,
  /**
   * What a route exposes as `data`. Resolved per read rather than captured, so it stays correct as
   * navigations replace the store its values live in.
   */
  getData: (route: ResolvedRoute) => WithData['data'],
}

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigations: RouterNavigationStoreSlots = {
    current: createRouterNavigationStore(),
    staged: createRouterNavigationStore(),
  }

  function createRouterNavigationStore(): RouterNavigationStore {
    const data = createDataStore()

    const state: RouterNavigationState = {
      route: undefined,
      responses: [],
      context: undefined,
    }

    function reportResponse(response: RouterNavigationComputationResponse): void {
      if (data.signal.aborted) {
        return
      }

      if (!state.context) {
        state.responses.push(response)
        return
      }

      onResponse?.({ ...response, ...state.context })
    }

    function setRoute(route: ResolvedRoute): void {
      if (state.route && !isSameResolvedRoute(state.route, route)) {
        throw new TypeError('Cannot compute values for another route in this navigation')
      }

      state.route ??= route
    }

    function compute(route: ResolvedRoute, computations: Computation[]): Promise<unknown>[] {
      if (data.signal.aborted) {
        return []
      }

      setRoute(route)
      const values = computations.map(({ key }) => data.subscribe(key))

      computations.forEach((computation) => {
        data.set(computation.key, () => {
          const response = toResponse(data.subscribe(computation.key))
          response.catch(() => {})

          reportResponse({ response, source: computation.kind })

          return run(computation, route, data)
        })
      })

      return values
    }

    function fill(route: ResolvedRoute, values: RouteValue[]): void {
      if (data.signal.aborted) {
        return
      }

      setRoute(route)
      const computations = getComputations(route)

      for (const { kind, depth, name, value } of values) {
        const computation = computations.find((computation) => computation.kind === kind && computation.depth === depth && computation.name === name)

        if (!computation) {
          continue
        }

        data.set(computation.key, () => value)
      }
    }

    function commit({ to, from = null }: RouterNavigationCommitOptions): Promise<unknown>[] {
      if (data.signal.aborted) {
        return []
      }

      setRoute(to)
      const previous = navigations.current
      const staged = navigations.staged
      navigations.current = instance
      navigations.staged = createRouterNavigationStore()

      if (previous !== instance) {
        previous.dispose()
      }

      if (staged !== instance && staged !== previous) {
        staged.dispose()
      }

      state.context ??= {
        to: state.route ?? to,
        from,
        signal: data.signal,
      }

      const pending = state.responses.splice(0)
      pending.forEach(reportResponse)

      return compute(to, getComputations(to))
    }

    function abandon(): void {
      data.abandon(new NavigationAbandonedError())
      state.responses.length = 0
    }

    function dispose(): void {
      data.dispose(new NavigationAbandonedError())
      state.responses.length = 0
      state.context = undefined
    }

    function stage(): void {
      if (navigations.staged === instance) {
        return
      }

      if (navigations.staged !== navigations.current) {
        navigations.staged.dispose()
      }

      navigations.staged = instance
    }

    const instance: RouterNavigationStore = {
      data,
      signal: data.signal,
      get route() {
        return state.route
      },
      compute,
      fill,
      stage,
      commit,
      abandon,
      dispose,
    }

    return instance
  }

  const current: RouterNavigationStores['current'] = () => navigations.current

  const staged: RouterNavigationStores['staged'] = (route) => {
    const pending = navigations.staged

    if (!route) {
      return pending
    }

    const matches = !pending.route || isSameResolvedRoute(pending.route, route)

    if (pending.signal.aborted || !matches) {
      pending.dispose()
      navigations.staged = createRouterNavigationStore()
    }

    return navigations.staged
  }

  const commit: RouterNavigationStores['commit'] = (options) => staged(options.to).commit(options)

  const getValues: RouterNavigationStores['getValues'] = (route) => {
    const store = navigations.current.data

    return getComputations(route).flatMap(({ kind, depth, name, key }) => {
      const result = store.get(key)

      if (result.kind !== 'value') {
        return []
      }

      return [{ kind, depth, name, value: result.value }]
    })
  }

  async function toResponse(value: Promise<unknown>): Promise<RouterNavigationResponse> {
    try {
      await value

      return { status: 'SUCCESS' }
    } catch (error) {
      if (error instanceof NavigationAbandonedError) {
        return { status: 'ABANDONED' }
      }

      if (error instanceof ContextPushError) {
        return error.response
      }

      if (error instanceof ContextRejectionError) {
        return error.response
      }

      throw error
    }
  }

  const getProps: RouterNavigationStores['getProps'] = (id, name, route) => {
    const key = getDataKey('props', id, name, route)
    const result = navigations.current.data.get(key)

    switch (result.kind) {
      case 'missing':
        return NO_PROPS

      case 'pending':
      case 'running':
        return toResult(navigations.current.data, key)

      case 'value':
      case 'error':
      case 'abandoned':
        return result
      default:
        return result satisfies never
    }
  }

  function getData(route: ResolvedRoute, store?: DataStore): WithData['data'] {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, DEFAULT_LOADER_NAME, route, store)
  }

  function run(computation: Computation, route: ResolvedRoute, store: DataStore): unknown {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

    return runWithContext(() => computation.run(toCallbackRoute(computation, route, store), {
      push,
      replace,
      reject,
      update,
      signal: store.signal,
      parent: getParentContext(route, computation.depth, store),
    }))
  }

  /**
   * Loaders cannot read their own route's data, which could create circular dependencies.
   * They can read parent data instead. Props callbacks read data from their computation store.
   * The proxy avoids subscribing to route.data until a callback actually reads it.
   */
  function toCallbackRoute({ kind, name }: Computation, route: ResolvedRoute, store?: DataStore): ResolvedRoute {
    return new Proxy(route, {
      get(target, property, receiver) {
        if (property !== 'data') {
          return Reflect.get(target, property, receiver)
        }

        if (kind === 'loader') {
          throw new LoaderDataAccessError(name)
        }

        // computing into a store that is not yet current resolves data against it as well as the
        // navigation's, so a getter does not have to know which of the two will compute what it reads
        return getData(route, store)
      },
    })
  }

  /**
   * The parent context for the callback at the given depth. Resolved per depth rather than from the last
   * match: every view in a nested route gets its own parent, not the resolved route's parent.
   */
  function getParentContext(route: ResolvedRoute, depth: number, store?: DataStore): PropsCallbackParent {
    if (depth === 0) {
      return
    }

    const parentMatch = route.matches[depth - 1]
    const { name: parentName = '' } = parentMatch

    return {
      name: parentName,
      get props() {
        return toValues(propsLocations(parentMatch), DEFAULT_VIEW_NAME, route, store)
      },
      get data() {
        return toValues(loaderLocations(parentMatch), DEFAULT_LOADER_NAME, route, store)
      },
    }
  }

  /**
   * A set of named values as a callback or component sees them. A lone unnamed value is given directly,
   * matching how it was written, and named values sit behind a proxy so only what is read is waited on.
   */
  function toValues(locations: ValueLocation[], bareName: string, route: ResolvedRoute, store?: DataStore): WithData['data'] {
    if (locations.length === 0) {
      return undefined
    }

    const [only] = locations

    if (locations.length === 1 && only.name === bareName) {
      return getValue(only, route, store)
    }

    const find = (property: string | symbol): ValueLocation | undefined => locations.find(({ name }) => name === property)

    const values: Record<string, Promise<unknown>> = {}

    return markRaw(new Proxy(values, {
      get(target, property) {
        const location = find(property)

        return location ? getValue(location, route, store) : Reflect.get(target, property)
      },
      has(target, property) {
        return Boolean(find(property)) || Reflect.has(target, property)
      },
      ownKeys() {
        return locations.map(({ name }) => name)
      },
      getOwnPropertyDescriptor(target, property) {
        const location = find(property)

        if (!location) {
          return Reflect.getOwnPropertyDescriptor(target, property)
        }

        return {
          configurable: true,
          enumerable: true,
          value: getValue(location, route, store),
        }
      },
    }))
  }

  /**
   * A value resolves from whichever arrives first, the store the reader belongs to or the navigation, so
   * a reader never has to know which of the two will compute it.
   */
  function getValue(location: ValueLocation, route: ResolvedRoute, store?: DataStore): Promise<unknown> {
    const key = getDataKey(location.kind, location.id, location.name, route)
    const current = navigations.current.data

    if (!store || store === current) {
      return current.subscribe(key)
    }

    const stored = store.get(key)
    const currentValue = current.get(key)

    if (stored.kind === 'missing' && currentValue.kind === 'missing') {
      warnWaitingOnUncomputedValue(location, route)
    }

    const value = firstToArrive([
      store.subscribe(key),
      current.subscribe(key),
    ])

    // firstToArrive derives a new promise, so the handler the store attached does not cover it
    value.catch(() => {})

    return value
  }

  return {
    current,
    create: createRouterNavigationStore,
    staged,
    commit,
    getValues,
    getProps,
    getData,
    setVueApp,
  }
}

/**
 * The first source to produce a value. Both failing surfaces a real callback error over an abandonment,
 * since abandonment only says nobody is computing that source any more.
 */
async function firstToArrive(sources: Promise<unknown>[]): Promise<unknown> {
  try {
    return await Promise.any(sources)
  } catch (error) {
    if (error instanceof AggregateError) {
      throw error.errors.find((reason) => !(reason instanceof NavigationAbandonedError)) ?? error.errors[0]
    }

    throw error
  }
}

/**
 * What a view with no props getter renders with, since such a view stores nothing.
 */
const NO_PROPS: PropsResult = { kind: 'value', value: undefined }

/**
 * The render layer expects every outcome as a value it can inspect, so a rejection is folded back into a
 * result rather than being handed on as one.
 */
async function toResult(store: DataStore, key: string): Promise<PropsResult> {
  try {
    return { kind: 'value', value: await store.subscribe(key) }
  } catch (error) {
    const result = store.get(key)

    if (result.kind === 'error' || result.kind === 'abandoned') {
      return result
    }

    throw error
  }
}

function warnWaitingOnUncomputedValue({ kind, name }: ValueLocation, route: ResolvedRoute): void {
  const routeName = route.name || 'unknown'
  const value = kind === 'props' ? `props "${name}"` : `loader data "${name}"`

  warn(`
    Waiting on ${value} for route "${routeName}" before anything is computing it.
    It cannot resolve until it is computed — by its own prefetch strategy, or by navigating. When
    prefetching, prefetch it with the same strategy to avoid stalling here.
  `)
}
