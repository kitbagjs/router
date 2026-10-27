import { HooksCollection } from '@/types/hooksCollection'

/**
 * Creates an empty execution collection to populate from multiple hook stores.
 */
export function createHooksCollection(): HooksCollection {
  return {
    redirects: [],
    onBeforeRouteEnter: [],
    onBeforeRouteUpdate: [],
    onBeforeRouteLeave: [],
    onAfterRouteEnter: [],
    onAfterRouteUpdate: [],
    onAfterRouteLeave: [],
    onError: [],
    onRejection: [],
  }
}
