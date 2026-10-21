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
import { createDataStore, DataResult, DataStore } from './createDataStore'
import { DataKind, getDataKey } from './getDataKey'
import { PropsResult } from '@/utilities/props'
import { warn } from '@/utilities/warn'
import { MaybePromise } from '@/types/utilities'
import { Computation, ComputationFilter, getComputations, isKind, loaderLocations, propsLocations, ValueLocation } from './getComputations'

/**
 * Computation stopped because its store was disposed.
 */
type RouteValueAbandoned = {
  status: 'ABANDONED',
}

export type RouteValueResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | RouteValueAbandoned

export type RouteValueResponseEvent = {
  response: Promise<RouteValueResponse>,
  source: DataKind,
}

type RouteValueResponseCallback = (response: RouteValueResponseEvent) => void

type NavigationStoreState = {
  data: DataStore,
  responses: RouteValueResponseEvent[],
  onResponse: RouteValueResponseCallback | undefined,
  committed: boolean,
}

type NavigationStoreInternal = {
  data: DataStore,
  commit: NavigationStores['commit'],
  dispose: (reason: Error) => void,
}

type NavigationStoreSlots = {
  current: NavigationStore & NavigationStoreInternal,
  staged?: NavigationStore & NavigationStoreInternal,
}

/**
 * Separate outcomes for props and loaders, so callers can wait for either independently.
 */
export type RouteValueResponses = {
  props: Promise<RouteValueResponse>,
  loaders: Promise<RouteValueResponse>,
  /**
   * Individual computations tracked by navigation progress.
   */
  values: Promise<unknown>[],
}

const ABANDONED = Promise.resolve<RouteValueResponse>({ status: 'ABANDONED' })
const ABANDONED_RESPONSES: RouteValueResponses = {
  props: ABANDONED,
  loaders: ABANDONED,
  values: [],
}

export type NavigationStore = {
  /**
   * Computes the supplied values and reports how they settle.
   */
  compute: (route: ResolvedRoute, filter?: ComputationFilter) => RouteValueResponses,
  /**
   * Adopts values that already settled, in place of running their getters.
   */
  fill: (route: ResolvedRoute, values: RouteValue[]) => void,
}

/**
 * A store kept apart from the navigation until it is staged, so values can be computed ahead of a
 * navigation that may never come.
 */
export type DetachedNavigationStore = NavigationStore & {
  /**
   * Disposes of the previously staged store and sets this store as staged.
   */
  stage: () => void,
  /**
   * Abandons what was computed and starts over.
   */
  reset: () => void,
  /**
   * Abandons what was computed.
   */
  dispose: () => void,
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

export type NavigationStores = HasVueAppStore & {
  stop: () => void,
  createDetachedStore: () => DetachedNavigationStore,
  /**
   * The store the next navigation adopts, created when nothing is staged. Values computed into it ahead of
   * the navigation are found under way when the navigation commits, while the rendered route keeps reading
   * its own store meanwhile.
   */
  staged: () => NavigationStore,
  /**
   * Makes the staged store current and computes whatever the route still lacks.
   */
  commit: (route: ResolvedRoute, onResponse?: RouteValueResponseCallback) => RouteValueResponses,
  /**
   * The values currently settled in the store.
   */
  getValues: (route: ResolvedRoute) => RouteValue[],
  getProps: (id: string, name: string, route: ResolvedRoute) => MaybePromise<PropsResult>,
  /**
   * What a route exposes as `data`. Resolved per read rather than captured, so it stays correct as
   * navigations replace the store its values live in.
   */
  getRouteData: (route: ResolvedRoute) => WithData['data'],
  getLoaderState: (location: ValueLocation<'loader'>, route: ResolvedRoute) => DataResult,
  getLoaderValue: (location: ValueLocation<'loader'>, route: ResolvedRoute) => Promise<unknown>,
}

export function createNavigationStores(): NavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const stores: NavigationStoreSlots = { current: createStore() }

  function createStore(): NavigationStore & NavigationStoreInternal {
    const state: NavigationStoreState = {
      data: createDataStore(),
      responses: [],
      onResponse: undefined,
      committed: false,
    }

    function reportResponse(response: RouteValueResponseEvent): void {
      if (state.data.signal.aborted) {
        return
      }

      if (!state.committed) {
        state.responses.push(response)
        return
      }

      state.onResponse?.(response)
    }

    function compute(route: ResolvedRoute, filter: ComputationFilter = () => true): RouteValueResponses {
      if (state.data.signal.aborted) {
        return ABANDONED_RESPONSES
      }

      const computations = getComputations(route).filter(filter)

      // loaders first, so a props getter reading the route's data finds it under way rather than missing
      const loaders = settle(route, computations.filter(isKind('loader')))
      const props = settle(route, computations.filter(isKind('props')))

      // a caller that does not wait on these must not see a getter's error as an unhandled rejection
      loaders.catch(() => {})
      props.catch(() => {})

      const values = computations.map(({ key }) => state.data.subscribe(key))

      return {
        props,
        loaders,
        values,
      }
    }

    function fill(route: ResolvedRoute, values: RouteValue[]): void {
      if (state.data.signal.aborted) {
        return
      }

      const computations = getComputations(route)

      for (const { kind, depth, name, value } of values) {
        const computation = computations.find((computation) => computation.kind === kind && computation.depth === depth && computation.name === name)

        if (!computation) {
          continue
        }

        state.data.set(computation.key, () => value)
      }
    }

    /**
     * Registers computations synchronously so props callbacks can subscribe to loaders immediately.
     * Existing computations keep their values and are not reported again.
     */
    function settle(route: ResolvedRoute, computations: Computation[]): Promise<RouteValueResponse> {
      computations.forEach((computation) => {
        state.data.set(computation.key, () => {
          const response = toResponse(state.data.subscribe(computation.key))
          response.catch(() => {})

          reportResponse({ response, source: computation.kind })

          return run(computation, route, state.data)
        })
      })

      return toResponse(Promise.all(computations.map(({ key }) => state.data.subscribe(key))))
    }

    function commit(route: ResolvedRoute, callback?: RouteValueResponseCallback): RouteValueResponses {
      state.onResponse = callback
      state.committed = true

      const pending = state.responses.splice(0)
      pending.forEach(reportResponse)

      return compute(route)
    }

    function dispose(reason: Error): void {
      state.data.dispose(reason)
      state.responses.length = 0
      state.onResponse = undefined
    }

    return {
      data: state.data,
      compute,
      fill,
      commit,
      dispose,
    }
  }

  const createDetachedStore: NavigationStores['createDetachedStore'] = () => {
    let store = createStore()

    const compute: DetachedNavigationStore['compute'] = (route, filter) => {
      return store.compute(route, filter)
    }

    const fill: DetachedNavigationStore['fill'] = (route, values) => {
      store.fill(route, values)
    }

    const dispose: DetachedNavigationStore['dispose'] = () => {
      store.dispose(new NavigationAbandonedError())
    }

    const reset: DetachedNavigationStore['reset'] = () => {
      dispose()
      store = createStore()
    }

    const stage: DetachedNavigationStore['stage'] = () => {
      stores.staged?.dispose(new NavigationAbandonedError())
      stores.staged = store
      store = createStore()
    }

    return {
      compute,
      fill,
      stage,
      reset,
      dispose,
    }
  }

  const staged: NavigationStores['staged'] = () => {
    stores.staged ??= createStore()

    return stores.staged
  }

  const stop: NavigationStores['stop'] = () => {
    const reason = new NavigationAbandonedError()
    stores.current.dispose(reason)
    stores.staged?.dispose(reason)
    stores.staged = undefined
  }

  const commit: NavigationStores['commit'] = (route, onResponse) => {
    const previous = stores.current
    stores.current = stores.staged ?? createStore()
    stores.staged = undefined
    previous.dispose(new NavigationAbandonedError())

    return stores.current.commit(route, onResponse)
  }

  const getValues: NavigationStores['getValues'] = (route) => {
    const store = stores.current.data

    return getComputations(route).flatMap(({ kind, depth, name, key }) => {
      const result = store.get(key)

      if (result.kind !== 'value') {
        return []
      }

      return [{ kind, depth, name, value: result.value }]
    })
  }

  async function toResponse(value: Promise<unknown>): Promise<RouteValueResponse> {
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

  const getProps: NavigationStores['getProps'] = (id, name, route) => {
    const key = getDataKey('props', id, name, route)
    const result = stores.current.data.get(key)

    switch (result.kind) {
      case 'missing':
        return NO_PROPS

      case 'pending':
      case 'running':
        return toResult(stores.current.data, key)

      case 'value':
      case 'error':
      case 'abandoned':
        return result
      default:
        return result satisfies never
    }
  }

  function getRouteData(route: ResolvedRoute, store?: DataStore): WithData['data'] {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, DEFAULT_LOADER_NAME, route, store)
  }

  const getLoaderState: NavigationStores['getLoaderState'] = (location: ValueLocation, route) => {
    if (location.kind !== 'loader') {
      throw new TypeError('Expected a loader location')
    }

    const store = stores.current.data
    const result = store.get(getDataKey(location.kind, location.id, location.name, route))

    if (store.signal.aborted) {
      return { kind: 'error', error: store.signal.reason }
    }

    return result
  }

  const getLoaderValue: NavigationStores['getLoaderValue'] = (location: ValueLocation, route) => {
    if (location.kind !== 'loader') {
      throw new TypeError('Expected a loader location')
    }

    return getValue(location, route)
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
        return getRouteData(route, store)
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
    const current = stores.current.data

    if (current.signal.aborted) {
      const abandoned = Promise.reject(new NavigationAbandonedError())
      abandoned.catch(() => {})

      return abandoned
    }

    if (current.signal.aborted) {
      const abandoned = Promise.reject(new NavigationAbandonedError())
      abandoned.catch(() => {})

      return abandoned
    }

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
    stop,
    createDetachedStore,
    staged,
    commit,
    getValues,
    getProps,
    getRouteData,
    getLoaderState,
    getLoaderValue,
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
