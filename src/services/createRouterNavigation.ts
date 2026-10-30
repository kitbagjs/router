import { markRaw } from 'vue'
import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'
import { ResolvedRoute } from '@/types/resolved'
import { DEFAULT_VIEW_NAME } from './routeViews'
import { DEFAULT_LOADER_NAME } from './addLoader'
import { toLegacyValues } from '@/utilities/toLegacyValues'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'
import { ContextPushError } from '@/errors/contextPushError'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { DataRecord } from '@/types/data'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextError, CallbackContextPush, CallbackContextReject, CallbackContextResponse } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { createDataStore, DataResult, DataStore, DataStoreSettledEvent } from './createDataStore'
import { DataKind, getDataKey } from './getDataKey'
import { PropsResult } from '@/utilities/props'
import { warn } from '@/utilities/warn'
import { MaybePromise } from '@/types/utilities'
import { isPromise } from '@/utilities/promises'
import { Computation, getComputations, isKind, loaderLocations, propsLocations, ValueLocation } from './getComputations'

export type RouterNavigationResponse = CallbackContextPush | CallbackContextReject | CallbackContextError

type RouterNavigationCommitOptions = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
}

export type RouterNavigationResponseEvent = RouterNavigationCommitOptions & {
  response: RouterNavigationResponse,
}

type CreateRouterNavigationOptions = {
  onResponse?: (response: RouterNavigationResponseEvent) => MaybePromise<void>,
}

type CallbackValueContext = {
  store: DataStore,
  signal: AbortSignal,
}

type RouterNavigationState = {
  abandoned: boolean,
}

type RouterNavigationStoreSlots = {
  current: RouterNavigationStore,
  staged: RouterNavigationStore,
}

export type RouterNavigationStore = {
  data: DataStore,
  /**
   * Disposes of the previously staged navigation and sets this navigation as staged.
   */
  stage: () => void,
  commit: (options: RouterNavigationCommitOptions) => Promise<CallbackContextResponse>[],
  abandon: () => void,
  dispose: () => void,
  /**
   * Computes the supplied values.
   */
  compute: (route: ResolvedRoute, computations: Computation[]) => Promise<CallbackContextResponse>[],
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
   * The navigation prepared for the next commit.
   * The rendered route keeps reading from the current navigation until then.
   */
  staged: () => RouterNavigationStore,
  /**
   * Makes the staged navigation current and computes whatever the route still lacks.
   */
  commit: (options: RouterNavigationCommitOptions) => Promise<CallbackContextResponse>[],
  /**
   * The values currently settled in the store.
   */
  getValues: (route: ResolvedRoute) => RouteValue[],
  getProps: (id: string, name: string, route: ResolvedRoute) => MaybePromise<PropsResult>,
  /**
   * Loader promises keyed by name, resolved against the current navigation on each read.
   */
  getRouteData: (route: ResolvedRoute) => DataRecord,
  getLoaderState: (location: ValueLocation<'loader'>, route: ResolvedRoute) => DataResult,
  getLoaderValue: (location: ValueLocation<'loader'>, route: ResolvedRoute) => Promise<unknown>,
}

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigations: RouterNavigationStoreSlots = {
    current: createRouterNavigationStore(),
    staged: createRouterNavigationStore(),
  }

  function createRouterNavigationStore(): RouterNavigationStore {
    const controller = new AbortController()
    const response = Promise.withResolvers<CallbackContextPush | CallbackContextReject>()
    const committed = Promise.withResolvers<RouterNavigationCommitOptions | undefined>()
    const state: RouterNavigationState = {
      abandoned: false,
    }
    const data = createDataStore({
      signal: controller.signal,
      onSettled: handleSettledValue,
    })

    function handleSettledValue({ result }: DataStoreSettledEvent): void {
      if (controller.signal.aborted) {
        return
      }

      switch (result.status) {
        case 'SUCCESS':
        case 'ABANDONED':
          return
        case 'ERROR':
          reportErrorWhenCommitted(result)
          return
        case 'PUSH':
        case 'REJECT':
          response.resolve(result)
          controller.abort(new NavigationAbandonedError())
          return
        default: {
          const exhaustive: never = result
          throw new Error(`Switch is not exhaustive for computation response: ${JSON.stringify(exhaustive)}`)
        }
      }
    }

    function reportErrorWhenCommitted(response: CallbackContextError): void {
      committed.promise.then((context) => {
        if (!context || controller.signal.aborted) {
          return
        }

        onResponse?.({ response, ...context })
      })
    }

    function compute(route: ResolvedRoute, computations: Computation[]): Promise<CallbackContextResponse>[] {
      if (controller.signal.aborted) {
        return []
      }

      const values = computations.map(({ key }) => data.subscribe(key))

      for (const computation of computations) {
        data.set(computation.key, () => run(computation, route))
      }

      return values
    }

    function run(computation: Computation, route: ResolvedRoute): MaybePromise<CallbackContextResponse> {
      try {
        const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

        const context: CallbackValueContext = {
          store: data,
          signal: controller.signal,
        }

        const value = runWithContext(() => computation.run(toCallbackRoute(computation, route, context), {
          push,
          replace,
          reject,
          update,
          signal: controller.signal,
          parent: getParentContext(route, computation.depth, context),
        }))

        if (isPromise(value)) {
          return value.then(toSuccessResponse, toErrorResponse)
        }

        return toSuccessResponse(value)
      } catch (error) {
        return toErrorResponse(error)
      }

      function toSuccessResponse(value: unknown): CallbackContextResponse {
        return { status: 'SUCCESS', value }
      }

      function toErrorResponse(error: unknown): CallbackContextResponse {
        if (error instanceof NavigationAbandonedError) {
          controller.abort(error)
        }

        if (error instanceof ContextPushError || error instanceof ContextRejectionError) {
          return error.response
        }

        return { status: 'ERROR', error, source: computation.kind }
      }
    }

    function fill(route: ResolvedRoute, values: RouteValue[]): void {
      if (controller.signal.aborted) {
        return
      }

      const computations = getComputations(route)

      for (const { kind, depth, name, value } of values) {
        const computation = computations.find((computation) => computation.kind === kind && computation.depth === depth && computation.name === name)

        if (!computation) {
          continue
        }

        data.set(computation.key, () => ({ status: 'SUCCESS', value }))
      }
    }

    function commit({ to, from }: RouterNavigationCommitOptions): Promise<CallbackContextResponse>[] {
      if (state.abandoned) {
        return []
      }

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

      committed.resolve({ to, from })
      response.promise.then((outcome) => {
        if (state.abandoned || navigations.current !== instance) {
          return
        }

        onResponse?.({ response: outcome, to, from })
      })

      return compute(to, getComputations(to))
    }

    function abandon(): void {
      state.abandoned = true
      controller.abort(new NavigationAbandonedError())
      committed.resolve(undefined)
    }

    function dispose(): void {
      if (navigations.staged === instance) {
        navigations.staged = createRouterNavigationStore()
      }

      abandon()
      data.dispose()
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

  const stop: RouterNavigationStores['stop'] = () => {
    navigations.current.dispose()
    navigations.staged.dispose()
  }

  const staged: RouterNavigationStores['staged'] = () => navigations.staged

  const commit: RouterNavigationStores['commit'] = (options) => navigations.staged.commit(options)

  const getValues: RouterNavigationStores['getValues'] = (route) => {
    const store = navigations.current.data

    return getComputations(route).flatMap(({ kind, depth, name, key }) => {
      const result = store.get(key)

      if (result.status !== 'SUCCESS') {
        return []
      }

      return [{ kind, depth, name, value: result.value }]
    })
  }

  const getProps: RouterNavigationStores['getProps'] = (id, name, route) => {
    const match = route.matches.find((match) => match.id === id)

    if (!match?.views[name]?.props) {
      return NO_PROPS
    }

    const key = getDataKey('props', id, name, route)
    const result = navigations.current.data.get(key)

    switch (result.status) {
      case 'MISSING':
        return NO_PROPS

      case 'PENDING':
      case 'RUNNING':
        return toResult(navigations.current.data, key)

      case 'ABANDONED':
        return { kind: 'abandoned' }

      case 'SUCCESS':
      case 'ERROR':
      case 'PUSH':
      case 'REJECT':
        return toPropsResult(result)
      default:
        return result satisfies never
    }
  }

  function getRouteData(route: ResolvedRoute): DataRecord {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, (location) => getComponentValue(location, route))
  }

  const getLoaderState: RouterNavigationStores['getLoaderState'] = (location: ValueLocation, route) => {
    if (location.kind !== 'loader') {
      throw new TypeError('Expected a loader location')
    }

    const result = navigations.current.data.get(getDataKey(location.kind, location.id, location.name, route))

    if (result.status === 'PUSH' || result.status === 'REJECT') {
      return { status: 'ABANDONED' }
    }

    return result
  }

  const getLoaderValue: RouterNavigationStores['getLoaderValue'] = (location: ValueLocation, route) => {
    if (location.kind !== 'loader') {
      throw new TypeError('Expected a loader location')
    }

    return getComponentValue(location, route)
  }

  /**
   * Loaders cannot read their own route's data, which could create circular dependencies.
   * They can read parent data instead. Props callbacks read data from their computation store.
   * The proxy avoids subscribing to loader data until a callback calls route.getData().
   */
  function toCallbackRoute({ kind, name }: Computation, route: ResolvedRoute, context: CallbackValueContext): ResolvedRoute {
    function getData(name = DEFAULT_LOADER_NAME): Promise<unknown> {
      const location = getRouteLoaderLocation(route, name)

      return getCallbackValue(location, route, context)
    }

    return new Proxy(route, {
      get(target, property, receiver) {
        if (property !== 'data' && property !== 'getData') {
          return Reflect.get(target, property, receiver)
        }

        if (kind === 'loader') {
          throw new LoaderDataAccessError(name)
        }

        if (property === 'data') {
          const loaders = getComputations(route).filter(isKind('loader'))
          const values = toValues(loaders, (location) => getCallbackValue(location, route, context))

          return toLegacyValues(values)
        }

        return getData
      },
    })
  }

  /**
   * The parent context for the callback at the given depth. Resolved per depth rather than from the last
   * match: every view in a nested route gets its own parent, not the resolved route's parent.
   */
  function getParentContext(route: ResolvedRoute, depth: number, context: CallbackValueContext): PropsCallbackParent {
    if (depth === 0) {
      return
    }

    const parentMatch = route.matches[depth - 1]
    const { name: parentName = '' } = parentMatch

    return {
      name: parentName,
      getData(name = DEFAULT_LOADER_NAME) {
        const location = getRouteLoaderLocation(route, name, route.matches.slice(0, depth))

        return getCallbackValue(location, route, context)
      },
      getProps(name: string = DEFAULT_VIEW_NAME) {
        const view = parentMatch.views[name]

        if (!Object.hasOwn(parentMatch.views, name) || !view.props) {
          throw new TypeError(`Parent route "${parentName}" has no props getter named "${name}"`)
        }

        return getCallbackValue({ kind: 'props', id: parentMatch.id, name }, route, context)
      },
      get props() {
        const values = toValues(propsLocations(parentMatch), (location) => getCallbackValue(location, route, context))

        return toLegacyValues(values)
      },
      get data() {
        const values = toValues(loaderLocations(parentMatch), (location) => getCallbackValue(location, route, context))

        return toLegacyValues(values)
      },
    }
  }

  /**
   * Named promises are read lazily so only requested values subscribe to the computation store.
   */
  function toValues(locations: ValueLocation[], read: (location: ValueLocation) => Promise<unknown>): DataRecord {
    const find = (property: string | symbol): ValueLocation | undefined => locations.find(({ name }) => name === property)

    const values: DataRecord = {}

    return markRaw(new Proxy(values, {
      get(target, property) {
        const location = find(property)

        if (location) {
          return read(location)
        }

        return Reflect.get(target, property)
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
          value: read(location),
        }
      },
    }))
  }

  function getComponentValue(location: ValueLocation, route: ResolvedRoute): Promise<unknown> {
    const key = getDataKey(location.kind, location.id, location.name, route)
    const value = toComponentValue(navigations.current.data.subscribe(key))

    value.catch(() => {})

    return value
  }

  function getCallbackValue(location: ValueLocation, route: ResolvedRoute, { store, signal }: CallbackValueContext): Promise<unknown> {
    const key = getDataKey(location.kind, location.id, location.name, route)
    const current = navigations.current.data

    if (store === current) {
      return toDataValue(store.subscribe(key))
    }

    const stored = store.get(key)
    const currentValue = current.get(key)

    if (stored.status === 'MISSING' && currentValue.status === 'MISSING') {
      warnWaitingOnUncomputedValue(location, route)
    }

    const value = waitForDependency([
      toDataValue(store.subscribe(key)),
      toDataValue(current.subscribe(key)),
    ], signal)

    value.catch(() => {})

    return value
  }

  return {
    current,
    stop,
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
 * What a view with no props getter renders with, since such a view stores nothing.
 */
const NO_PROPS: PropsResult = { kind: 'value', value: undefined }

/**
 * The render layer expects every outcome as a value it can inspect, so a rejection is folded back into a
 * result rather than being handed on as one.
 */
async function toResult(store: DataStore, key: string): Promise<PropsResult> {
  try {
    return toPropsResult(await store.subscribe(key))
  } catch (error) {
    const result = store.get(key)

    if (result.status === 'ABANDONED') {
      return { kind: 'abandoned' }
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

function toDataValue(value: Promise<CallbackContextResponse>): Promise<unknown> {
  const unwrapped = value.then(unwrapComputationResponse)

  unwrapped.catch(() => {})

  return unwrapped
}

function toPropsResult(response: CallbackContextResponse): PropsResult {
  if (response.status === 'PUSH' || response.status === 'REJECT') {
    return { kind: 'abandoned' }
  }

  try {
    return { kind: 'value', value: unwrapComputationResponse(response) }
  } catch (error) {
    return { kind: 'error', error }
  }
}

async function toComponentValue(response: Promise<CallbackContextResponse>): Promise<unknown> {
  try {
    return await toDataValue(response)
  } catch (error) {
    if (error instanceof NavigationAbandonedError) {
      return new Promise<never>(() => {})
    }

    throw error
  }
}

async function waitForDependency(sources: Promise<unknown>[], signal: AbortSignal): Promise<unknown> {
  const cancelled = Promise.withResolvers<never>()

  function onAbort(): void {
    cancelled.reject(new NavigationAbandonedError())
  }

  if (signal.aborted) {
    onAbort()
  } else {
    signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    return await Promise.race([
      firstToArrive(sources),
      cancelled.promise,
    ])
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}
