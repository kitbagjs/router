import { createDataStore, DataStore } from './createDataStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { ResolvedRoute } from '@/types/resolved'
import { parseUrl, stringifyUrl } from '@/services/urlParser'

/**
 * Which store the rendered route reads from, and which one the next navigation will adopt.
 *
 * A navigation gets its own store so the one it replaces can be disposed outright. A store built ahead of
 * a navigation is staged for it to pick up — staged rather than handed over directly because it is built
 * before that navigation starts.
 */
export type NavigationStores = {
  /**
   * The store the rendered route reads props from.
   */
  current: () => DataStore,
  /**
   * Parks a store for the next navigation. A store already parked is disposed, since staging a second
   * store before a navigation arrives abandons the first.
   */
  stage: (store: DataStore) => void,
  /**
   * The staged store, created when nothing was staged, so a navigation can compute into it ahead of
   * adopting it.
   */
  staged: () => DataStore,
  /**
   * Swaps in the staged store, or a fresh one, and hands back the store being replaced for disposal.
   */
  promote: () => DataStore,
}

/**
 * The store in use, and the one staged for the next navigation. Nothing is staged unless something stages
 * a store ahead of navigating, so a navigation with nothing prepared finds it unset.
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

  const staged: NavigationStores['staged'] = () => {
    stores.staged ??= createDataStore()

    return stores.staged
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
    staged,
    promote,
  }
}

/**
 * What a stored value is: the props of a view, or the data of a loader. Part of the key so that a view
 * and a loader sharing a name on the same route are still two values.
 */
export type DataKind = 'props' | 'loader'

export function getDataKey(kind: DataKind, id: string, name: string, route: ResolvedRoute): string {
  const { host, path, query } = parseUrl(route.href)

  return [kind, id, name, route.id, stringifyUrl({ host, path, query })].join('-')
}
