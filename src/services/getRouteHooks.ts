import { ResolvedRoute } from '@/types/resolved'
import { Hooks } from '@/models/hooks'

export function getBeforeHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()

  if (to) {
    hooks.redirects.push(...to.hooks.redirects)
    hooks.onBeforeRouteEnter.push(...to.hooks.onBeforeRouteEnter)
    hooks.onBeforeRouteUpdate.push(...to.hooks.onBeforeRouteUpdate)
  }

  if (from) {
    hooks.onBeforeRouteLeave.push(...from.hooks.onBeforeRouteLeave)
  }

  return hooks
}

export function getAfterHooksFromRoutes(to: ResolvedRoute | null, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()

  if (to) {
    hooks.onAfterRouteEnter.push(...to.hooks.onAfterRouteEnter)
    hooks.onAfterRouteUpdate.push(...to.hooks.onAfterRouteUpdate)
  }

  if (from) {
    hooks.onAfterRouteLeave.push(...from.hooks.onAfterRouteLeave)
  }

  return hooks
}
