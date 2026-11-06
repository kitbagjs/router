import { nextTick } from 'vue'
import { ComputationStore, ComputationResponse } from '@/services/createComputationStore'
import { Computation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { createAbortPromise, isPromise } from '@/utilities/promises'

export type Navigation = {
  route: ResolvedRoute | null,
  store: ComputationStore,
  controller: AbortController,
  run: () => Promise<void>,
}

/**
 * Complete finishes without preparing or activating a local view. Abort skips completion and after hooks.
 */
export type BeforeNavigationResult = 'continue' | 'complete' | 'abort'

export type NavigationOptions = {
  route: ResolvedRoute | null,
  computations: Computation[],
  loadViews: () => Promise<unknown>[],
  before?: (controller: AbortController) => MaybePromise<BeforeNavigationResult>,
  after?: (controller: AbortController) => MaybePromise<void>,
  onCommit: (work: Promise<unknown>[], controller: AbortController) => void,
  onResponse?: (response: ComputationResponse) => MaybePromise<void>,
  prepare?: boolean,
  transition?: (commit: () => Promise<boolean>) => Promise<void>,
}

type CreateNavigationOptions = NavigationOptions & {
  store: ComputationStore,
  activate: (navigation: Navigation) => void,
}

export function createNavigation({ route, computations, loadViews, store, before, after, onCommit, onResponse, prepare: shouldPrepare, transition, activate }: CreateNavigationOptions): Navigation {
  const controller = new AbortController()
  const isAborted = (): boolean => controller.signal.aborted

  function compute(): Promise<unknown>[] {
    if (!route) {
      return []
    }

    return [...store.compute(route, computations), ...loadViews()]
  }

  async function prepare(): Promise<void> {
    await Promise.race([
      Promise.allSettled(compute()),
      createAbortPromise(controller.signal),
    ])
  }

  function commit(): Promise<boolean> {
    if (isAborted() || store.abandoned) {
      return Promise.resolve(false)
    }

    activate(navigation)
    store.activate(onResponse)
    const work = compute()
    onCommit(work, controller)

    return nextTick().then(() => !controller.signal.aborted)
  }

  function run(): Promise<void> {
    if (isAborted()) {
      return Promise.resolve()
    }

    const result = before?.(controller)

    if (isPromise(result)) {
      return result.then(proceed)
    }

    return proceed(result)
  }

  async function proceed(result: BeforeNavigationResult | undefined): Promise<void> {
    if (result === 'abort' || isAborted()) {
      controller.abort()

      return
    }

    if (result === 'complete') {
      onCommit([], controller)
      await after?.(controller)

      return
    }

    if (shouldPrepare) {
      await prepare()
    }

    if (isAborted()) {
      return
    }

    if (transition) {
      await transition(commit)

      await after?.(controller)

      return
    }

    await Promise.all([
      commit(),
      after?.(controller),
    ])
  }

  const navigation = {
    route,
    store,
    controller,
    run,
  }

  return navigation
}
