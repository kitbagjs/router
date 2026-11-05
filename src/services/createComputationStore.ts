import { Computation, ValueLocation } from '@/types/computation'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'
import { ResolvedRoute } from '@/types/resolved'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { CallbackContextError, CallbackContextPush, CallbackContextReject, CallbackContextResponse } from '@/types/callbackContext'
import { createDataStore, DataEntry, DataResult, DataStore, DataStoreSettledEvent } from './createDataStore'
import { getDataKey } from './getDataKey'
import { MaybePromise } from '@/types/utilities'
import { isPromise } from '@/utilities/promises'
import { getComputations } from './getComputations'
import { warnWaitingOnUncomputedValue } from '@/services/warnWaitingOnUncomputedValue'

export type ComputationResponse = CallbackContextPush | CallbackContextReject | CallbackContextError

export type ComputationCommitOptions = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
}

export type ComputationResponseEvent = {
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
  response: ComputationResponse,
}

type ComputationState = {
  abandoned: boolean,
}

export type NavigationData = {
  getEntries: () => DataEntry[],
  setEntries: (entries: DataEntry[]) => void,
  getState: (location: ValueLocation, route: ResolvedRoute) => DataResult,
  subscribe: (location: ValueLocation, route: ResolvedRoute) => Promise<CallbackContextResponse>,
  getValue: (location: ValueLocation, route: ResolvedRoute) => Promise<unknown>,
}

export type ComputationStore = NavigationData & {
  data: DataStore,
  readonly abandoned: boolean,
  commit: (options: ComputationCommitOptions) => Promise<CallbackContextResponse>[],
  abandon: () => void,
  dispose: () => void,
  compute: (route: ResolvedRoute, computations: Computation[]) => Promise<CallbackContextResponse>[],
}

type CreateComputationStoreOptions = {
  runWithContext: <T>(callback: () => T) => T,
  getCurrent?: () => DataStore,
  onResponse?: (response: ComputationResponseEvent) => MaybePromise<void>,
}

export function createComputationStore({ runWithContext, getCurrent, onResponse }: CreateComputationStoreOptions): ComputationStore {
  const controller = new AbortController()
  const response = Promise.withResolvers<CallbackContextPush | CallbackContextReject>()
  const committed = Promise.withResolvers<ComputationCommitOptions | undefined>()
  const state: ComputationState = {
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
      const getValue = (location: ValueLocation): Promise<unknown> => getCallbackValue(location, route)
      const value = runWithContext(() => computation.run({
        to: route,
        signal: controller.signal,
        getValue,
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

  function commit({ to, from }: ComputationCommitOptions): Promise<CallbackContextResponse>[] {
    if (state.abandoned) {
      return []
    }

    committed.resolve({ to, from })
    response.promise.then((outcome) => {
      if (!state.abandoned) {
        onResponse?.({ response: outcome, to, from })
      }
    })

    return compute(to, getComputations(to))
  }

  function abandon(): void {
    state.abandoned = true
    controller.abort(new NavigationAbandonedError())
    committed.resolve(undefined)
  }

  function dispose(): void {
    abandon()
    data.dispose()
  }

  const getState: NavigationData['getState'] = (location, route) => {
    const key = getDataKey({ ...location, route })

    return data.get(key)
  }

  const subscribe: NavigationData['subscribe'] = (location, route) => {
    const key = getDataKey({ ...location, route })

    return data.subscribe(key)
  }

  const getValue: NavigationData['getValue'] = (location, route) => toDataValue(subscribe(location, route))

  const getEntries = data.getEntries
  const setEntries = data.setEntries

  const instance: ComputationStore = {
    data,
    get abandoned() {
      return state.abandoned
    },
    getState,
    subscribe,
    getValue,
    compute,
    getEntries,
    setEntries,
    commit,
    abandon,
    dispose,
  }

  function getCallbackValue(location: ValueLocation, route: ResolvedRoute): Promise<unknown> {
    const key = getDataKey({ ...location, route })
    const store = data
    const { signal } = controller
    const current = getCurrent?.() ?? store

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

  return instance
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
