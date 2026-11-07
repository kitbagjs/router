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
  transition?: (commit: () => void) => Promise<void>,
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

  function commit(): void {
    if (isAborted() || store.abandoned) {
      return
    }

    activate(navigation)
    store.activate((response) => {
      if (!controller.signal.aborted) {
        return onResponse?.(response)
      }
    })
    const work = compute()
    onCommit(work, controller)
  }

  async function run(): Promise<void> {
    const result = before?.(controller)

    if (isPromise(result)) {
      await result
    }

    if (isAborted()) {
      return
    }

    if (shouldCommit) {
      if (shouldPrepare) {
        await prepare()
      }

      if (isAborted()) {
        return
      }

      if (transition) {
        await transition(commit)
      } else {
        commit()
      }
    }

    await after?.(controller)
    await nextTick()
  }

  const navigation = {
    route,
    store,
    controller,
    run,
  }

  return navigation
}
