import { RouteHooks } from '@/models/RouteHooks'
import { ResolvedRoute } from '@/types/resolved'
import { asArray } from '@/utilities/array'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/utilities/hooks'

export function getBeforeRouteHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute): RouteHooks {
  const hooks = new RouteHooks()

  to.matches.forEach((route, depth) => {
    if (route.onBeforeRouteEnter && isRouteEnter(to, from, depth)) {
      asArray(route.onBeforeRouteEnter).forEach(hook => hooks.onBeforeRouteEnter.add(hook))
    }

    if (route.onBeforeRouteUpdate && isRouteUpdate(to, from, depth)) {
      asArray(route.onBeforeRouteUpdate).forEach(hook => hooks.onBeforeRouteUpdate.add(hook))
    }
  })

  from.matches.forEach((route, depth) => {
    if (route.onBeforeRouteLeave && isRouteLeave(to, from, depth)) {
      asArray(route.onBeforeRouteLeave).forEach(hook => hooks.onBeforeRouteLeave.add(hook))
    }
  })

  return hooks
}

export function getAfterRouteHooksFromRoutes(to: ResolvedRoute, from: ResolvedRoute): RouteHooks {
  const hooks = new RouteHooks()

  to.matches.forEach((route, depth) => {
    if (route.onAfterRouteEnter && isRouteEnter(to, from, depth)) {
      asArray(route.onAfterRouteEnter).forEach(hook => hooks.onAfterRouteEnter.add(hook))
    }

    if (route.onAfterRouteUpdate && isRouteUpdate(to, from, depth)) {
      asArray(route.onAfterRouteUpdate).forEach(hook => hooks.onAfterRouteUpdate.add(hook))
    }
  })

  from.matches.forEach((route, depth) => {
    if (route.onAfterRouteLeave && isRouteLeave(to, from, depth)) {
      asArray(route.onAfterRouteLeave).forEach(hook => hooks.onAfterRouteLeave.add(hook))
    }
  })

  return hooks
}