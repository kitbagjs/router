import { markRaw } from 'vue'
import { createActivityTracker } from './createActivityTracker'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { DEFAULT_VIEW_NAME } from './routeViews'
import { DEFAULT_LOADER_NAME } from './addLoader'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'
import { ComputationResponse } from '@/types/computationResponse'
import { ContextPushError } from '@/errors/contextPushError'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextError, CallbackContextPush, CallbackContextReject } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { createDataStore, DataStore, DataStoreSettledEvent } from './createDataStore'
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
  onResponse?: (response: RouterNavigationResponseEvent) => void,
}

type RouterNavigationState = {
  abandoned: boolean,
}

type RouterNavigationStoreSlots = {
  current: RouterNavigationStore,
  staged: RouterNavigationStore,
}

export type RouterNavigationStore = {
  data: DataStore<ComputationResponse>,
  idle: () => Promise<void>,
  /**
   * Disposes of the previously staged navigation and sets this navigation as staged.
   */
  stage: () => void,
  commit: (options: RouterNavigationCommitOptions) => Promise<unknown>[],
  abandon: () => void,
  dispose: () => void,
  /**
   * Computes the supplied values.
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
  idle: () => Promise<void>,
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
    const controller = new AbortController()
    const activity = createActivityTracker()
    const response = Promise.withResolvers<CallbackContextPush | CallbackContextReject>()
    const committed = Promise.withResolvers<RouterNavigationCommitOptions | undefined>()
    const state: RouterNavigationState = {
      abandoned: false,
    }
    const data = createDataStore<ComputationResponse>({
      signal: controller.signal,
      onSettled: handleSettledValue,
    })

    function handleSettledValue({ result }: DataStoreSettledEvent<ComputationResponse>): void {
      if (controller.signal.aborted || result.kind !== 'value') {
        return
      }

      const outcome = result.value

      switch (outcome.status) {
        case 'SUCCESS':
          return
        case 'ERROR':
          reportErrorWhenCommitted(outcome)
          return
        case 'PUSH':
        case 'REJECT':
          response.resolve(outcome)
          controller.abort(new NavigationAbandonedError())
          return
        default: {
          const exhaustive: never = outcome
          throw new Error(`Switch is not exhaustive for computation response: ${JSON.stringify(exhaustive)}`)
        }
      }
    }

    function reportErrorWhenCommitted(response: CallbackContextError): void {
      activity.add(committed.promise.then((context) => {
        if (!context || controller.signal.aborted) {
          return
        }

        onResponse?.({ response, ...context })
      }))
    }

    function compute(route: ResolvedRoute, computations: Computation[]): Promise<unknown>[] {
      if (controller.signal.aborted) {
        return []
      }

      const values = computations.map(({ key }) => toDataValue(data.subscribe(key)))

      for (const computation of computations) {
        data.set(computation.key, () => run(computation, route))
      }

      activity.add(...values)

      return values
    }

    function run(computation: Computation, route: ResolvedRoute): MaybePromise<ComputationResponse> {
      try {
        const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

        const value = runWithContext(() => computation.run(toCallbackRoute(computation, route, data), {
          push,
          replace,
          reject,
          update,
          signal: controller.signal,
          parent: getParentContext(route, computation.depth, data),
        }))

        if (isPromise(value)) {
          return value.then(
            (value): ComputationResponse => ({ status: 'SUCCESS', value }),
            toErrorResponse,
          )
        }

        return { status: 'SUCCESS', value }
      } catch (error) {
        return toErrorResponse(error)
      }

      function toErrorResponse(error: unknown): ComputationResponse {
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

    function commit({ to, from }: RouterNavigationCommitOptions): Promise<unknown>[] {
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
      idle: activity.idle,
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

  const idle: RouterNavigationStores['idle'] = () => navigations.current.idle()

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

      if (result.kind !== 'value' || result.value.status !== 'SUCCESS') {
        return []
      }

      return [{ kind, depth, name, value: result.value.value }]
    })
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
        return toPropsResult(result.value)

      case 'error':
      case 'abandoned':
        return result
      default:
        return result satisfies never
    }
  }

  function getData(route: ResolvedRoute, store?: DataStore<ComputationResponse>): WithData['data'] {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, DEFAULT_LOADER_NAME, route, store)
  }

  /**
   * Loaders cannot read their own route's data, which could create circular dependencies.
   * They can read parent data instead. Props callbacks read data from their computation store.
   * The proxy avoids subscribing to route.data until a callback actually reads it.
   */
  function toCallbackRoute({ kind, name }: Computation, route: ResolvedRoute, store?: DataStore<ComputationResponse>): ResolvedRoute {
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
  function getParentContext(route: ResolvedRoute, depth: number, store?: DataStore<ComputationResponse>): PropsCallbackParent {
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
  function toValues(locations: ValueLocation[], bareName: string, route: ResolvedRoute, store?: DataStore<ComputationResponse>): WithData['data'] {
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
  function getValue(location: ValueLocation, route: ResolvedRoute, store?: DataStore<ComputationResponse>): Promise<unknown> {
    const key = getDataKey(location.kind, location.id, location.name, route)
    const current = navigations.current.data

    if (!store || store === current) {
      return toDataValue(current.subscribe(key))
    }

    const stored = store.get(key)
    const currentValue = current.get(key)

    if (stored.kind === 'missing' && currentValue.kind === 'missing') {
      warnWaitingOnUncomputedValue(location, route)
    }

    const value = firstToArrive([
      toDataValue(store.subscribe(key)),
      toDataValue(current.subscribe(key)),
    ])

    value.catch(() => {})

    return value
  }

  return {
    current,
    idle,
    stop,
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
async function toResult(store: DataStore<ComputationResponse>, key: string): Promise<PropsResult> {
  try {
    return toPropsResult(await store.subscribe(key))
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

function toDataValue(value: Promise<ComputationResponse>): Promise<unknown> {
  const unwrapped = value.then(unwrapComputationResponse)

  unwrapped.catch(() => {})

  return unwrapped
}

function toPropsResult(response: ComputationResponse): PropsResult {
  try {
    return { kind: 'value', value: unwrapComputationResponse(response) }
  } catch (error) {
    return { kind: 'error', error }
  }
}
