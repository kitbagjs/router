import { ResolvedRoute } from '@/types/resolved'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { createRouterNavigationStore, RouterNavigationStore } from './createRouterNavigationStore'

export type RouterNavigationStores = HasVueAppStore & {
  get: (route: ResolvedRoute) => RouterNavigationStore,
  set: (route: ResolvedRoute, store: RouterNavigationStore) => void,
  create: () => RouterNavigationStore,
  abandon: (route: ResolvedRoute) => void,
}

export function createRouterNavigation(): RouterNavigationStores {
  const { setVueApp, runWithContext } = createVueAppStore()
  const stores = new WeakMap<ResolvedRoute, RouterNavigationStore>()

  function create(): RouterNavigationStore {
    return createRouterNavigationStore({ runWithContext })
  }

  function get(route: ResolvedRoute): RouterNavigationStore {
    const existing = stores.get(route)

    if (existing) {
      return existing
    }

    const store = create()

    stores.set(route, store)

    return store
  }

  function set(route: ResolvedRoute, store: RouterNavigationStore): void {
    const existing = stores.get(route)

    if (existing && existing !== store) {
      existing.abandon()
    }

    stores.set(route, store)
  }

  function abandon(route: ResolvedRoute): void {
    stores.get(route)?.abandon()
  }

  return { get, set, create, abandon, setVueApp }
}
