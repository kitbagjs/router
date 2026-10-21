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
 * Computation stopped because its navigation was disposed.
 */
type NavigationAbandoned = {
  status: 'ABANDONED',
}

export type NavigationResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | NavigationAbandoned

export type NavigationResponseEvent = {
  response: Promise<NavigationResponse>,
  source: DataKind,
}

type NavigationResponseCallback = (response: NavigationResponseEvent) => void

type NavigationState = {
  data: DataStore,
  responses: NavigationResponseEvent[],
  onResponse: NavigationResponseCallback | undefined,
  committed: boolean,
}

type NavigationInstanceInternal = {
  data: DataStore,
  commit: Navigation['commit'],
  dispose: (reason: Error) => void,
}

type NavigationInstances = {
  current: NavigationInstance & NavigationInstanceInternal,
  staged?: NavigationInstance & NavigationInstanceInternal,
}

/**
 * Separate outcomes for props and loaders, so callers can wait for either independently.
 */
export type NavigationResponses = {
  props: Promise<NavigationResponse>,
  loaders: Promise<NavigationResponse>,
  /**
   * Individual computations tracked by navigation progress.
   */
  values: Promise<unknown>[],
}

const ABANDONED = Promise.resolve<NavigationResponse>({ status: 'ABANDONED' })
const ABANDONED_RESPONSES: NavigationResponses = {
  props: ABANDONED,
  loaders: ABANDONED,
  values: [],
}

export type NavigationInstance = {
  /**
   * Computes the supplied values and reports how they settle.
   */
  compute: (route: ResolvedRoute, filter?: ComputationFilter) => NavigationResponses,
  /**
   * Adopts values that already settled, in place of running their getters.
   */
  fill: (route: ResolvedRoute, values: RouteValue[]) => void,
}

/**
 * Computations prepared ahead of a navigation that may never happen.
 */
export type PrefetchNavigation = NavigationInstance & {
  /**
   * Disposes of the previously staged navigation and sets this navigation as staged.
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

export type Navigation = HasVueAppStore & {
  createPrefetch: () => PrefetchNavigation,
  /**
   * The navigation prepared for the next commit, created when nothing is staged.
   * The rendered route keeps reading from the current navigation until then.
   */
  staged: () => NavigationInstance,
  /**
   * Makes the staged navigation current and computes whatever the route still lacks.
   */
  commit: (route: ResolvedRoute, onResponse?: NavigationResponseCallback) => NavigationResponses,
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

export function createNavigation(): Navigation {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigations: NavigationInstances = { current: createNavigationInstance() }

  function createNavigationInstance(): NavigationInstance & NavigationInstanceInternal {
    const state: NavigationState = {
      data: createDataStore(),
      responses: [],
      onResponse: undefined,
      committed: false,
    }

    function reportResponse(response: NavigationResponseEvent): void {
      if (state.data.signal.aborted) {
        return
      }

      if (!state.committed) {
        state.responses.push(response)
        return
      }

      state.onResponse?.(response)
    }

    function compute(route: ResolvedRoute, filter: ComputationFilter = () => true): NavigationResponses {
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
    function settle(route: ResolvedRoute, computations: Computation[]): Promise<NavigationResponse> {
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

    function commit(route: ResolvedRoute, callback?: NavigationResponseCallback): NavigationResponses {
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

  const createPrefetch: Navigation['createPrefetch'] = () => {
    let instance = createNavigationInstance()

    const compute: PrefetchNavigation['compute'] = (route, filter) => {
      return instance.compute(route, filter)
    }

    const fill: PrefetchNavigation['fill'] = (route, values) => {
      instance.fill(route, values)
    }

    const dispose: PrefetchNavigation['dispose'] = () => {
      instance.dispose(new NavigationAbandonedError())
    }

    const reset: PrefetchNavigation['reset'] = () => {
      dispose()
      instance = createNavigationInstance()
    }

    const stage: PrefetchNavigation['stage'] = () => {
      navigations.staged?.dispose(new NavigationAbandonedError())
      navigations.staged = instance
      instance = createNavigationInstance()
    }

    return {
      compute,
      fill,
      stage,
      reset,
      dispose,
    }
  }

  const staged: Navigation['staged'] = () => {
    navigations.staged ??= createNavigationInstance()

    return navigations.staged
  }

  const commit: Navigation['commit'] = (route, onResponse) => {
    const previous = navigations.current
    navigations.current = navigations.staged ?? createNavigationInstance()
    navigations.staged = undefined
    previous.dispose(new NavigationAbandonedError())

    return navigations.current.commit(route, onResponse)
  }

  const getValues: Navigation['getValues'] = (route) => {
    const store = navigations.current.data

    return getComputations(route).flatMap(({ kind, depth, name, key }) => {
      const result = store.get(key)

      if (result.kind !== 'value') {
        return []
      }

      return [{ kind, depth, name, value: result.value }]
    })
  }

  async function toResponse(value: Promise<unknown>): Promise<NavigationResponse> {
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

  const getProps: Navigation['getProps'] = (id, name, route) => {
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

  function getRouteData(route: ResolvedRoute, store?: DataStore): WithData['data'] {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, DEFAULT_LOADER_NAME, route, store)
  }

  const getLoaderState: Navigation['getLoaderState'] = (location: ValueLocation, route) => {
    if (location.kind !== 'loader') {
      throw new TypeError('Expected a loader location')
    }

    return navigations.current.data.get(getDataKey(location.kind, location.id, location.name, route))
  }

  const getLoaderValue: Navigation['getLoaderValue'] = (location: ValueLocation, route) => {
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
    const current = navigations.current.data

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
    createPrefetch,
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
 * What a view with no props getter renders with, since such a view navigations nothing.
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
