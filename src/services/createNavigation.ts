import { nextTick } from 'vue'
import { ComputationStore, ComputationResponse } from '@/services/createComputationStore'
import { Resolved, ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { createAbortPromise, isPromise } from '@/utilities/promises'

export type Navigation<TResolved extends Resolved = ResolvedRoute> = {
  route: TResolved | null,
  store: ComputationStore,
  controller: AbortController,
  run: () => Promise<void>,
}

export type NavigationOptions<TResolved extends Resolved = ResolvedRoute> = {
  route: TResolved | null,
  compute: (store: ComputationStore) => Promise<unknown>[],
  before?: (controller: AbortController) => MaybePromise<void>,
  after?: (controller: AbortController) => MaybePromise<void>,
  onCommit: (work: Promise<unknown>[], controller: AbortController) => void,
  onResponse?: (response: ComputationResponse) => MaybePromise<void>,
  commit?: boolean,
  prepare?: boolean,
  transition?: (commit: () => Promise<boolean>) => Promise<void>,
}

type CreateNavigationOptions<TResolved extends Resolved> = NavigationOptions<TResolved> & {
  store: ComputationStore,
  activate: (navigation: Navigation<TResolved>) => void,
}

export function createNavigation<TResolved extends Resolved>({ route, compute: computeValues, store, before, after, onCommit, onResponse, commit: shouldCommit = true, prepare: shouldPrepare, transition, activate }: CreateNavigationOptions<TResolved>): Navigation<TResolved> {
  const controller = new AbortController()
  const isAborted = (): boolean => controller.signal.aborted

  function compute(): Promise<unknown>[] {
    if (!route) {
      return []
    }

    return computeValues(store)
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
    store.activate((response) => {
      if (!controller.signal.aborted) {
        return onResponse?.(response)
      }
    })
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

    return proceed()
  }

  async function proceed(): Promise<void> {
    if (isAborted()) {
      return
    }

    if (!shouldCommit) {
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
