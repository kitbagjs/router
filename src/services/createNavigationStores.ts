import { createDataStore, DataStore } from './createDataStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { ResolvedRoute } from '@/types/resolved'

/**
 * Which store the rendered route reads from, and which one the next navigation will adopt.
 *
 * A navigation gets its own store so the one it replaces can be disposed outright. A followed link stages
 * the store it prefetched into, which the navigation it triggers picks up — staged rather than handed over
 * directly because a link is followed before that navigation starts.
 */
export type NavigationStores = {
  /**
   * The store the rendered route reads props from.
   */
  current: () => DataStore,
  /**
   * Parks a followed link's store for the navigation it triggered. A store already parked is disposed,
   * since following a second link before the first navigation arrives abandons the first.
   */
  stage: (store: DataStore) => void,
  /**
   * Swaps in the staged store, or a fresh one, and hands back the store being replaced for disposal.
   */
  promote: () => DataStore,
}

/**
 * The store in use, and the one a followed link left for the next navigation. Staging only happens when a
 * link is followed, so starting the router, pushing directly and history navigation all leave it unset.
 */
type Stores = {
  current: DataStore,
  staged?: DataStore,
}

export function createNavigationStores(): NavigationStores {
  const stores: Stores = { current: createDataStore() }

  const current: NavigationStores['current'] = () => stores.current

  const stage: NavigationStores['stage'] = (store) => {
    stores.staged?.dispose(new NavigationAbandonedError())
    stores.staged = store
  }

  const promote: NavigationStores['promote'] = () => {
    const previous = stores.current

    stores.current = stores.staged ?? createDataStore()
    stores.staged = undefined

    return previous
  }

  return {
    current,
    stage,
    promote,
  }
}

export function getDataKey(id: string, name: string, route: ResolvedRoute): string {
  return [id, name, route.id, JSON.stringify(route.params)].join('-')
}
