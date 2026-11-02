import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'
import { ResolvedRoute } from '@/types/resolved'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextError, CallbackContextPush, CallbackContextReject, CallbackContextResponse } from '@/types/callbackContext'
import { createDataStore, DataResult, DataStore, DataStoreSettledEvent } from './createDataStore'
import { DataKind, getDataKey } from './getDataKey'
import { MaybePromise } from '@/types/utilities'
import { isPromise } from '@/utilities/promises'
import { Computation, getComputations, ValueLocation } from './getComputations'
import { warnWaitingOnUncomputedValue } from '@/services/warnWaitingOnUncomputedValue'

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

export type NavigationData = {
  getState: (location: ValueLocation, route: ResolvedRoute) => DataResult,
  subscribe: (location: ValueLocation, route: ResolvedRoute) => Promise<CallbackContextResponse>,
  getValue: (location: ValueLocation, route: ResolvedRoute) => Promise<unknown>,
}

export type RouterNavigationStore = NavigationData & {
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

export type RouterNavigationStores = HasVueAppStore & NavigationData & {
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
  getValues: (route: ResolvedRoute, kind?: DataKind) => RouteValue[],
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
        const value = runWithContext(() => computation.run({
          to: route,
          signal: controller.signal,
          getState: (location) => getState(location, route),
          subscribe: (location) => getCallbackResponse(location, route, { store: data, signal: controller.signal }),
          getValue: (location) => getCallbackValue(location, route, { store: data, signal: controller.signal }),
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

    const getState: NavigationData['getState'] = (location, route) => {
      const key = getDataKey(location.kind, location.id, location.name, route)

      return data.get(key)
    }

    const subscribe: NavigationData['subscribe'] = (location, route) => {
      const key = getDataKey(location.kind, location.id, location.name, route)

      return data.subscribe(key)
    }

    const getValue: NavigationData['getValue'] = (location, route) => toDataValue(subscribe(location, route))

    const instance: RouterNavigationStore = {
      data,
      getState,
      subscribe,
      getValue,
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

  const getState: NavigationData['getState'] = (location, route) => navigations.current.getState(location, route)

  const subscribe: NavigationData['subscribe'] = (location, route) => navigations.current.subscribe(location, route)

  const getValue: NavigationData['getValue'] = (location, route) => navigations.current.getValue(location, route)

  const getValues: RouterNavigationStores['getValues'] = (route, expectedKind) => {
    const store = navigations.current.data

    return getComputations(route).flatMap(({ kind, depth, name, key }) => {
      if (expectedKind !== undefined && kind !== expectedKind) {
        return []
      }

      const result = store.get(key)

      if (result.status !== 'SUCCESS') {
        return []
      }

      return [{ kind, depth, name, value: result.value }]
    })
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

  function getCallbackResponse(location: ValueLocation, route: ResolvedRoute, { store, signal }: CallbackValueContext): Promise<CallbackContextResponse> {
    const key = getDataKey(location.kind, location.id, location.name, route)
    const local = store.get(key)
    const current = navigations.current.data

    if (local.status !== 'MISSING' || store === current) {
      return store.subscribe(key)
    }

    const currentValue = current.get(key)

    if (currentValue.status === 'MISSING') {
      warnWaitingOnUncomputedValue(location, route)
    }

    return waitForDependency([
      store.subscribe(key),
      current.subscribe(key),
    ], signal) as Promise<CallbackContextResponse>
  }

  return {
    current,
    stop,
    create: createRouterNavigationStore,
    staged,
    commit,
    getValues,
    getState,
    subscribe,
    getValue,
    setVueApp,
  }
}

function toDataValue(value: Promise<CallbackContextResponse>): Promise<unknown> {
  const unwrapped = value.then(unwrapComputationResponse)

  unwrapped.catch(() => {})

  return unwrapped
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
