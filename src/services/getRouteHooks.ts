import { Hooks } from '@/models/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { getHooks } from '@/types/hooks'

export function getBeforeHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()

  getHooks(to).forEach((store, depth, stores) => {
    // A redirect fires only when the route that declared it is the matched route. Collected from an
    // ancestor, it would intercept the navigation into its own subtree that the redirect itself causes.
    if (depth === stores.length - 1) {
      hooks.add(...store.get('redirects'))
    }

    if (isRouteEnter(to, from, depth)) {
      return hooks.add(...store.get('onBeforeRouteEnter'))
    }

    if (isRouteUpdate(to, from, depth)) {
      return hooks.add(...store.get('onBeforeRouteUpdate'))
    }
  })

  getHooks(from).forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return hooks.add(...store.get('onBeforeRouteLeave'))
    }
  })

  return hooks
}

export function getAfterHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()

  getHooks(to).forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return hooks.add(...store.get('onAfterRouteEnter'))
    }

    if (isRouteUpdate(to, from, depth)) {
      return hooks.add(...store.get('onAfterRouteUpdate'))
    }
  })

  getHooks(from).forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return hooks.add(...store.get('onAfterRouteLeave'))
    }
  })

  return hooks
}
