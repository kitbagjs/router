import { CollectedHooks } from '@/types/collectedHooks'

export function createCollectedHooks(): CollectedHooks {
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
