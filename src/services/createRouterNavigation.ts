import { Computation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextError, CallbackContextPush, CallbackContextReject, CallbackContextResponse } from '@/types/callbackContext'
import { DataStore } from './createDataStore'
import { createComputationStore, NavigationData } from '@/services/createComputationStore'
import { MaybePromise } from '@/types/utilities'
import { getComputations } from './getComputations'

export type { NavigationData } from '@/services/createComputationStore'

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

type RouterNavigationStoreSlots = {
  current: RouterNavigationStore,
  staged: RouterNavigationStore,
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
}

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigations: RouterNavigationStoreSlots = {
    current: createRouterNavigationStore(),
    staged: createRouterNavigationStore(),
  }

  function createRouterNavigationStore(): RouterNavigationStore {
    const store = createComputationStore({
      runWithContext,
      getCurrent: () => navigations.current.data,
    })

    function commit({ to, from }: RouterNavigationCommitOptions): Promise<CallbackContextResponse>[] {
      if (store.abandoned) {
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

      store.activate((response) => onResponse?.({ response, to, from }))

      return store.compute(to, getComputations(to))
    }

    function dispose(): void {
      if (navigations.staged === instance) {
        navigations.staged = createRouterNavigationStore()
      }

      store.dispose()
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
      ...store,
      stage,
      commit,
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

  const getEntries: NavigationData['getEntries'] = () => navigations.current.getEntries()

  const setEntries: NavigationData['setEntries'] = (entries) => navigations.current.setEntries(entries)

  return {
    current,
    stop,
    create: createRouterNavigationStore,
    staged,
    commit,
    getEntries,
    setEntries,
    getState,
    subscribe,
    getValue,
    setVueApp,
  }
}
