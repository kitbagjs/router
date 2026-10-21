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
type RouterNavigationAbandoned = {
  status: 'ABANDONED',
}

export type RouterNavigationResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | RouterNavigationAbandoned

type RouterNavigationComputationResponse = {
  response: Promise<RouterNavigationResponse>,
  source: DataKind,
}

type RouterNavigationCommitOptions = {
  from: ResolvedRoute | null,
  signal: AbortSignal,
}

type RouterNavigationContext = RouterNavigationCommitOptions & {
  to: ResolvedRoute,
}

export type RouterNavigationResponseEvent = RouterNavigationComputationResponse & RouterNavigationContext

type CreateRouterNavigationOptions = {
  onResponse?: (response: RouterNavigationResponseEvent) => void,
}

type RouterNavigationState = {
  data: DataStore,
  responses: RouterNavigationComputationResponse[],
  context: RouterNavigationContext | undefined,
}

type RouterNavigationStoreSlots = {
  current: RouterNavigationStore,
  staged?: RouterNavigationStore,
}

/**
 * Separate outcomes for props and loaders, so callers can wait for either independently.
 */
export type RouterNavigationResponses = {
  props: Promise<RouterNavigationResponse>,
  loaders: Promise<RouterNavigationResponse>,
  /**
   * Individual computations tracked by navigation progress.
   */
  values: Promise<unknown>[],
}

const ABANDONED = Promise.resolve<RouterNavigationResponse>({ status: 'ABANDONED' })
const ABANDONED_RESPONSES: RouterNavigationResponses = {
  props: ABANDONED,
  loaders: ABANDONED,
  values: [],
}

export type RouterNavigationStore = {
  data: DataStore,
  /**
   * Disposes of the previously staged navigation and sets this navigation as staged.
   */
  stage: () => void,
  commit: (route: ResolvedRoute, options?: RouterNavigationCommitOptions) => RouterNavigationResponses,
  dispose: () => void,
  /**
   * Computes the supplied values and reports how they settle.
   */
  compute: (route: ResolvedRoute, filter?: ComputationFilter) => RouterNavigationResponses,
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
  stop: () => void,
  create: () => RouterNavigationStore,
  /**
   * The navigation prepared for the next commit, created when nothing is staged.
   * The rendered route keeps reading from the current navigation until then.
   */
  staged: () => RouterNavigationStore,
  /**
   * Makes the staged navigation current and computes whatever the route still lacks.
   */
  commit: (route: ResolvedRoute, options?: RouterNavigationCommitOptions) => RouterNavigationResponses,
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

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigations: RouterNavigationStoreSlots = { current: createRouterNavigationStore() }

  function createRouterNavigationStore(): RouterNavigationStore {
    const state: RouterNavigationState = {
      data: createDataStore(),
      responses: [],
      context: undefined,
    }

    function reportResponse(response: RouterNavigationComputationResponse): void {
      if (state.data.signal.aborted) {
        return
      }

      if (!state.context) {
        state.responses.push(response)
        return
      }

      onResponse?.({ ...response, ...state.context })
    }

    function compute(route: ResolvedRoute, filter: ComputationFilter = () => true): RouterNavigationResponses {
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
    function settle(route: ResolvedRoute, computations: Computation[]): Promise<RouterNavigationResponse> {
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

    function commit(route: ResolvedRoute, options?: RouterNavigationCommitOptions): RouterNavigationResponses {
      const previous = navigations.current
      const staged = navigations.staged
      navigations.current = instance
      navigations.staged = undefined

      if (previous !== instance) {
        previous.dispose()
      }

      if (staged && staged !== instance && staged !== previous) {
        staged.dispose()
      }

      state.context = {
        to: route,
        from: options?.from ?? null,
        signal: options?.signal ?? state.data.signal,
      }

      const pending = state.responses.splice(0)
      pending.forEach(reportResponse)

      return compute(route)
    }

    function dispose(): void {
      state.data.dispose(new NavigationAbandonedError())
      state.responses.length = 0
      state.context = undefined
    }

    function stage(): void {
      if (navigations.staged === instance) {
        return
      }

      if (navigations.staged !== navigations.current) {
        navigations.staged?.dispose()
      }

      navigations.staged = instance
    }

    const instance: RouterNavigationStore = {
      data: state.data,
      compute,
      fill,
      stage,
      commit,
      dispose,
    }

    return instance
  }

  const current: RouterNavigationStores['current'] = () => navigations.current

  const staged: RouterNavigationStores['staged'] = () => {
    navigations.staged ??= createRouterNavigationStore()

    return navigations.staged
  }

  const stop: RouterNavigationStores['stop'] = () => {
    navigations.current.dispose()
    navigations.staged?.dispose()
    navigations.staged = undefined
  }

  const commit: RouterNavigationStores['commit'] = (route, options) => {
    const instance = navigations.staged ?? createRouterNavigationStore()

    return instance.commit(route, options)
  }

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
    const match = route.matches.find((match) => match.id === id)

    if (!match?.views[name]?.props) {
      return NO_PROPS
    }

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

  const getLoaderState: RouterNavigationStores['getLoaderState'] = (location: ValueLocation, route) => {
    if (location.kind !== 'loader') {
      throw new TypeError('Expected a loader location')
    }

    const store = navigations.current.data
    const result = store.get(getDataKey(location.kind, location.id, location.name, route))

    if (store.signal.aborted) {
      return { kind: 'error', error: store.signal.reason }
    }

    return result
  }

  const getLoaderValue: RouterNavigationStores['getLoaderValue'] = (location: ValueLocation, route) => {
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
    current,
    create: createRouterNavigationStore,
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
