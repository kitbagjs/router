import { HooksCollection } from '@/types/hooksCollection'

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
