import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from './hooks'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { Routes } from '@/main'

export function getGlobalBeforeRouteHooks<
  TRoutes extends Routes,
  TRejections extends string
>(to: ResolvedRoute, from: ResolvedRoute | null, globalHooks: RouterRouteHooks<TRoutes, TRejections>): RouterRouteHooks<TRoutes, TRejections> {
  const hooks = new RouterRouteHooks<TRoutes, TRejections>()

  to.matches.forEach((_route, depth) => {
    if (isRouteEnter(to, from, depth)) {
      globalHooks.onBeforeRouteEnter.forEach((hook) => hooks.onBeforeRouteEnter.add(hook))
    }

    if (isRouteUpdate(to, from, depth)) {
      globalHooks.onBeforeRouteUpdate.forEach((hook) => hooks.onBeforeRouteUpdate.add(hook))
    }
  })

  from?.matches.forEach((_route, depth) => {
    if (isRouteLeave(to, from, depth)) {
      globalHooks.onBeforeRouteLeave.forEach((hook) => hooks.onBeforeRouteLeave.add(hook))
    }
  })

  return hooks
}

export function getGlobalAfterRouteHooks<
  TRoutes extends Routes,
  TRejections extends string
>(to: ResolvedRoute, from: ResolvedRoute | null, globalHooks: RouterRouteHooks<TRoutes, TRejections>): RouterRouteHooks<TRoutes, TRejections> {
  const hooks = new RouterRouteHooks<TRoutes, TRejections>()

  to.matches.forEach((_route, depth) => {
    if (isRouteEnter(to, from, depth)) {
      globalHooks.onAfterRouteEnter.forEach((hook) => hooks.onAfterRouteEnter.add(hook))
    }

    if (isRouteUpdate(to, from, depth)) {
      globalHooks.onAfterRouteUpdate.forEach((hook) => hooks.onAfterRouteUpdate.add(hook))
    }
  })

  from?.matches.forEach((_route, depth) => {
    if (isRouteLeave(to, from, depth)) {
      globalHooks.onAfterRouteLeave.forEach((hook) => hooks.onAfterRouteLeave.add(hook))
    }
  })

  return hooks
}
