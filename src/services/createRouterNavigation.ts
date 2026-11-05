import { shallowReactive } from 'vue'
import { createComputationStore, ComputationStore, ComputationCommitOptions, ComputationResponseEvent, NavigationData } from '@/services/createComputationStore'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { DataEntry } from '@/services/createDataStore'
import { ResolvedRoute } from '@/types/resolved'
import { Rejection } from '@/types/rejection'
import { CallbackContextResponse } from '@/types/callbackContext'
import { MaybePromise } from '@/types/utilities'

export type { NavigationData } from '@/services/createComputationStore'

type CreateRouterNavigationOptions = {
  onResponse?: (response: ComputationResponseEvent) => MaybePromise<void>,
}

export type NavigationEntry = {
  route: ResolvedRoute,
  store: ComputationStore,
}

type RejectionEntry = NavigationEntry & {
  rejection: Rejection,
}

type NavigationEntries = {
  route: NavigationEntry | null,
  rejection: RejectionEntry | null,
}

type RejectionCommitOptions = {
  route: ResolvedRoute,
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
  rejection: Rejection,
  values?: DataEntry[],
}

export type RouterNavigationStore = ComputationStore & {
  stage: () => void,
}

export type RouterNavigationStores = HasVueAppStore & NavigationData & {
  entries: Readonly<NavigationEntries>,
  active: () => NavigationEntry | null,
  current: () => RouterNavigationStore,
  stop: () => void,
  create: () => RouterNavigationStore,
  staged: () => RouterNavigationStore,
  commit: (options: ComputationCommitOptions) => Promise<CallbackContextResponse>[],
  clearRejection: () => void,
  reject: (options: RejectionCommitOptions) => Promise<CallbackContextResponse>[],
}

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const entries = shallowReactive<NavigationEntries>({ route: null, rejection: null })
  const navigations = {
    current: createRouterNavigationStore(),
    staged: createRouterNavigationStore(),
  }

  function createRouterNavigationStore(): RouterNavigationStore {
    const store = createComputationStore({
      runWithContext,
      onResponse,
      getCurrent: () => navigations.current.data,
    })

    function commit(options: ComputationCommitOptions): Promise<CallbackContextResponse>[] {
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

      clearRejection()
      entries.route = { route: options.to, store: instance }

      return store.commit(options)
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
      get abandoned() {
        return store.abandoned
      },
      stage,
      commit,
      dispose,
    }

    return instance
  }

  function reject({ route, to, from, rejection, values = [] }: RejectionCommitOptions): Promise<CallbackContextResponse>[] {
    navigations.staged.dispose()
    navigations.current.abandon()
    entries.rejection?.store.dispose()

    const handleResponse = (event: ComputationResponseEvent): MaybePromise<void> => onResponse?.({ ...event, to, from })
    const store = createComputationStore({ runWithContext, onResponse: handleResponse })
    store.setEntries(values)
    entries.rejection = { route, store, rejection }

    return store.commit({ to: route, from })
  }

  function clearRejection(): void {
    entries.rejection?.store.dispose()
    entries.rejection = null
  }

  const active = (): NavigationEntry | null => entries.rejection ?? entries.route
  const current = (): RouterNavigationStore => navigations.current
  const staged = (): RouterNavigationStore => navigations.staged
  const commit: RouterNavigationStores['commit'] = (options) => navigations.staged.commit(options)

  function stop(): void {
    navigations.current.dispose()
    navigations.staged.dispose()
    entries.rejection?.store.dispose()
  }

  const getState: NavigationData['getState'] = (location, route) => navigations.current.getState(location, route)
  const subscribe: NavigationData['subscribe'] = (location, route) => navigations.current.subscribe(location, route)
  const getValue: NavigationData['getValue'] = (location, route) => navigations.current.getValue(location, route)
  const getEntries: NavigationData['getEntries'] = () => navigations.current.getEntries()
  const setEntries: NavigationData['setEntries'] = (values) => navigations.current.setEntries(values)

  return {
    entries,
    active,
    current,
    staged,
    commit,
    reject,
    clearRejection,
    stop,
    create: createRouterNavigationStore,
    getEntries,
    setEntries,
    getState,
    subscribe,
    getValue,
    setVueApp,
  }
}
