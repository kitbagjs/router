import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { CallbackContextResponse } from '@/types/callbackContext'
import { MaybePromise } from '@/types/utilities'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'
import { isPromise } from '@/utilities/promises'
import { createDataStore, DataEntry, DataResult, DataStoreSettledEvent } from './createDataStore'
import { Computation } from './getComputations'
import { ResolvedRoute } from '@/types/resolved'

export type RouterNavigationResponse = Exclude<CallbackContextResponse, { status: 'SUCCESS' }>

export type NavigationData = {
  getState: (key: string) => DataResult,
  subscribe: (key: string) => Promise<CallbackContextResponse>,
  getValue: (key: string) => Promise<unknown>,
  getEntries: () => DataEntry[],
  setEntries: (entries: { key: string, value: CallbackContextResponse }[]) => void,
}

export type RouterNavigationStore = NavigationData & {
  compute: (route: ResolvedRoute, computations: Computation[]) => Promise<CallbackContextResponse>[],
  abandon: () => void,
  onResponse: (callback: (response: RouterNavigationResponse) => void, signal: AbortSignal) => void,
}

type CreateRouterNavigationStoreOptions = {
  runWithContext: <T>(callback: () => T) => T,
}

export function createRouterNavigationStore({ runWithContext }: CreateRouterNavigationStoreOptions): RouterNavigationStore {
  const controller = new AbortController()
  const listeners = new Set<(response: RouterNavigationResponse) => void>()
  let abandoned = false
  const data = createDataStore({ signal: controller.signal, onSettled })

  function onSettled({ result }: DataStoreSettledEvent): void {
    if (abandoned || result.status === 'SUCCESS' || result.status === 'ABANDONED') {
      return
    }

    if (result.status === 'PUSH' || result.status === 'REJECT') {
      controller.abort(new NavigationAbandonedError())
    }

    for (const listener of listeners) {
      listener(result)
    }
  }

  function onResponse(callback: (response: RouterNavigationResponse) => void, signal: AbortSignal): void {
    const isActive = (): boolean => !abandoned && !signal.aborted

    if (!isActive()) {
      return
    }

    listeners.add(callback)
    signal.addEventListener('abort', () => listeners.delete(callback), { once: true })

    for (const { value } of data.getEntries()) {
      if (!isActive()) {
        return
      }

      if (value.status === 'ERROR' || value.status === 'PUSH' || value.status === 'REJECT') {
        callback(value)
      }
    }
  }

  function getValue(key: string): Promise<unknown> {
    const value = data.subscribe(key).then(unwrapComputationResponse)

    value.catch(() => {})

    return value
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

  function run(computation: Computation, to: ResolvedRoute): MaybePromise<CallbackContextResponse> {
    try {
      const value = runWithContext(() => computation.run({ to, signal: controller.signal, getValue }))

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

  function setEntries(entries: { key: string, value: CallbackContextResponse }[]): void {
    for (const { key, value } of entries) {
      data.set(key, () => value)
    }
  }

  function abandon(): void {
    abandoned = true
    listeners.clear()
    controller.abort(new NavigationAbandonedError())
  }

  const getState = data.get
  const subscribe = data.subscribe
  const getEntries = data.getEntries

  return { getState, subscribe, getValue, getEntries, setEntries, compute, abandon, onResponse }
}
