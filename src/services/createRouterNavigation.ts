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

export type RouterNavigationStores = HasVueAppStore & NavigationData & {
  entries: Readonly<Ref<readonly NavigationEntry[]>>,
  setActive: (entries: NavigationEntry[]) => void,
  active: () => NavigationEntry | null,
  current: () => ComputationStore,
  stop: () => void,
  create: (onResponse?: (response: ComputationResponseEvent) => MaybePromise<void>) => ComputationStore,
  stage: (store: ComputationStore) => void,
  staged: () => ComputationStore,
  commit: (options: ComputationCommitOptions) => Promise<CallbackContextResponse>[],
}

export function createRouterNavigation({ onResponse }: CreateRouterNavigationOptions = {}): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const entries = shallowRef<readonly NavigationEntry[]>([])
  const navigations = {
    current: create(),
    staged: create(),
  }

  function create(handleResponse = onResponse): ComputationStore {
    const store: ComputationStore = createComputationStore({
      runWithContext,
      onResponse: handleResponse,
      getCurrent: () => {
        if (entries.value.some((entry) => entry.store === store)) {
          return store.data
        }

        return navigations.current.data
      },
    })

    return store
  }

  function stage(store: ComputationStore): void {
    if (navigations.staged === store) {
      return
    }

    if (navigations.staged !== navigations.current) {
      navigations.staged.dispose()
    }

    navigations.staged = store
  }

  function commit(options: ComputationCommitOptions): Promise<CallbackContextResponse>[] {
    const store = navigations.staged

    if (store.abandoned) {
      return []
    }

    const previous = navigations.current
    navigations.current = store
    navigations.staged = create()

    if (previous !== store) {
      previous.dispose()
    }

    return store.commit(options)
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
  const current = (): ComputationStore => navigations.current
  const staged = (): ComputationStore => navigations.staged

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
    stop,
    create,
    stage,
    getEntries,
    setEntries,
    getState,
    subscribe,
    getValue,
    setVueApp,
  }
}
