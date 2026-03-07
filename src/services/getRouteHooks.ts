import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/services/hooks'
import { Hooks } from '@/models/hooks'
import { isWithHooks } from '@/types/hooks'

export function getBeforeHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()

  if (isWithHooks(to)) {
    to.hooks.forEach((store, depth) => {
      store.redirects.forEach((hook) => hooks.redirects.add(hook))

      if (isRouteEnter(to, from, depth)) {
        return store.onBeforeRouteEnter.forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
      }

      if (isRouteUpdate(to, from, depth)) {
        return store.onBeforeRouteUpdate.forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
      }
    })
  }

  if (from && isWithHooks(from)) {
    from.hooks.forEach((store, depth) => {
      if (isRouteLeave(to, from, depth)) {
        return store.onBeforeRouteLeave.forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
      }
    })
  }

  return hooks
}

export function getAfterHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute | null): Hooks {
  const hooks = new Hooks()

  if (isWithHooks(to)) {
    to.hooks.forEach((store, depth) => {
      if (isRouteEnter(to, from, depth)) {
        return store.onAfterRouteEnter.forEach((hook) => hooks.onAfterRouteEnter.add(hook))
      }

      if (isRouteUpdate(to, from, depth)) {
        return store.onAfterRouteUpdate.forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
      }
    })
  }

  if (from && isWithHooks(from)) {
    from.hooks.forEach((store, depth) => {
      if (isRouteLeave(to, from, depth)) {
        return store.onAfterRouteLeave.forEach((hook) => hooks.onAfterRouteLeave.add(hook))
      }
    })
  }

  return hooks
}
