import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { HooksCollection } from '@/types/hooksCollection'
import { createHooksCollection } from '@/services/createHooksCollection'
import { getHooks } from '@/types/hooks'

export function getBeforeHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): HooksCollection {
  const hooks = createHooksCollection()

  getHooks(to).forEach((store, depth, stores) => {
    // A redirect fires only when the route that declared it is the matched route. Collected from an
    // ancestor, it would intercept the navigation into its own subtree that the redirect itself causes.
    if (depth === stores.length - 1) {
      hooks.add(store, 'redirects')
    }

    if (isRouteEnter(to, from, depth)) {
      return hooks.add(store, 'onBeforeRouteEnter')
    }

    if (isRouteUpdate(to, from, depth)) {
      return hooks.add(store, 'onBeforeRouteUpdate')
    }
  })

  getHooks(from).forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return hooks.add(store, 'onBeforeRouteLeave')
    }
  })

  return hooks
}

export function getAfterHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): HooksCollection {
  const hooks = createHooksCollection()

  getHooks(to).forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return hooks.add(store, 'onAfterRouteEnter')
    }

    if (isRouteUpdate(to, from, depth)) {
      return hooks.add(store, 'onAfterRouteUpdate')
    }
  })

  getHooks(from).forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return hooks.add(store, 'onAfterRouteLeave')
    }
  })

  return hooks
}
