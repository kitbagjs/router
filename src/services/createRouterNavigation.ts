import { shallowRef, Ref } from 'vue'
import { createComputationStore, ComputationStore, ComputationCommitOptions, ComputationResponseEvent, NavigationData } from '@/services/createComputationStore'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { ResolvedRoute } from '@/types/resolved'
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

export type RouterNavigationStore = ComputationStore & {
  stage: () => void,
}

export type RouterNavigationStores = HasVueAppStore & NavigationData & {
  entries: Readonly<Ref<readonly NavigationEntry[]>>,
  setActive: (entries: NavigationEntry[]) => void,
  createStore: (onResponse?: (response: ComputationResponseEvent) => MaybePromise<void>) => ComputationStore,
  active: () => NavigationEntry | null,
  current: () => RouterNavigationStore,
  stop: () => void,
  create: () => RouterNavigationStore,
  staged: () => RouterNavigationStore,
  commit: (options: ComputationCommitOptions) => Promise<CallbackContextResponse>[],
}

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const entries = shallowRef<readonly NavigationEntry[]>([])
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

  function createStore(handleResponse = onResponse): ComputationStore {
    return createComputationStore({ runWithContext, onResponse: handleResponse })
  }

  function setActive(next: NavigationEntry[]): void {
    const stores = new Set(next.map(({ store }) => store))

    for (const { store } of entries.value) {
      if (!stores.has(store)) {
        store.dispose()
      }
    }

    entries.value = next
  }

  const active = (): NavigationEntry | null => entries.value.at(-1) ?? null
  const current = (): RouterNavigationStore => navigations.current
  const staged = (): RouterNavigationStore => navigations.staged
  const commit: RouterNavigationStores['commit'] = (options) => navigations.staged.commit(options)

  function stop(): void {
    const stores = new Set([navigations.current, navigations.staged, ...entries.value.map(({ store }) => store)])

    for (const store of stores) {
      store.dispose()
    }
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
    setActive,
    createStore,
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
