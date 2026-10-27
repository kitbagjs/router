import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { CollectedHooks } from '@/models/collectedHooks'
import { getHooks } from '@/types/hooks'

export function getBeforeHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): CollectedHooks {
  const hooks = new CollectedHooks()

  getHooks(to).forEach((store, depth, stores) => {
    // A redirect fires only when the route that declared it is the matched route. Collected from an
    // ancestor, it would intercept the navigation into its own subtree that the redirect itself causes.
    if (depth === stores.length - 1) {
      hooks.redirects.push(...store.redirects)
    }

    if (isRouteEnter(to, from, depth)) {
      return hooks.onBeforeRouteEnter.push(...store.onBeforeRouteEnter)
    }

    if (isRouteUpdate(to, from, depth)) {
      return hooks.onBeforeRouteUpdate.push(...store.onBeforeRouteUpdate)
    }
  })

  getHooks(from).forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return hooks.onBeforeRouteLeave.push(...store.onBeforeRouteLeave)
    }
  })

  return hooks
}

export function getAfterHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): CollectedHooks {
  const hooks = new CollectedHooks()

  getHooks(to).forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return hooks.onAfterRouteEnter.push(...store.onAfterRouteEnter)
    }

    if (isRouteUpdate(to, from, depth)) {
      return hooks.onAfterRouteUpdate.push(...store.onAfterRouteUpdate)
    }
  })

  getHooks(from).forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return hooks.onAfterRouteLeave.push(...store.onAfterRouteLeave)
    }
  })

  return hooks
}
