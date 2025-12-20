import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'

export function getBeforeRouteHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): RouterRouteHooks {
  const hooks = new RouterRouteHooks()

  to.hooks.forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return store.onBeforeRouteEnter.forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
    }

    if (isRouteUpdate(to, from, depth)) {
      return store.onBeforeRouteUpdate.forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
    }
  })

  from?.hooks.forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return store.onBeforeRouteLeave.forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
    }
  })

  return hooks
}

export function getAfterRouteHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): RouterRouteHooks {
  const hooks = new RouterRouteHooks()

  to.hooks.forEach((store, depth) => {
    if (isRouteEnter(to, from, depth)) {
      return store.onAfterRouteEnter.forEach((hook) => hooks.onAfterRouteEnter.add(hook))
    }

    if (isRouteUpdate(to, from, depth)) {
      return store.onAfterRouteUpdate.forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
    }
  })

  from?.hooks.forEach((store, depth) => {
    if (isRouteLeave(to, from, depth)) {
      return store.onAfterRouteLeave.forEach((hook) => hooks.onAfterRouteLeave.add(hook))
    }
  })

  return hooks
}
