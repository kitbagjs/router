import { Hooks } from '@/models/hooks'
import { HooksCollection, HookStoreKey } from '@/types/hooksCollection'

/**
 * Creates an empty execution collection to populate from multiple hook stores.
 */
export function createHooksCollection(): HooksCollection {
  const collection: HooksCollection = {
    redirects: [],
    onBeforeRouteEnter: [],
    onBeforeRouteUpdate: [],
    onBeforeRouteLeave: [],
    onAfterRouteEnter: [],
    onAfterRouteUpdate: [],
    onAfterRouteLeave: [],
    onError: [],
    onRejection: [],
    add,
  }

  function add(store: Hooks, lifecycle: HookStoreKey): void {
    const hooks: unknown[] = collection[lifecycle]

    hooks.push(...store[lifecycle])
  }

  return collection
}
