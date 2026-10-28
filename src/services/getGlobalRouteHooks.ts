import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from './hooks'
import { Hooks } from '@/models/hooks'

export function getGlobalBeforeHooks(to: ResolvedRoute | null, from: ResolvedRoute | null, globalStores: Hooks[]): Hooks {
  const hooks = new Hooks()

  for (const globalHooks of globalStores) {
    if (to?.matches.some((_route, depth) => isRouteEnter(to, from, depth))) {
      hooks.onBeforeRouteEnter.push(...globalHooks.onBeforeRouteEnter)
    }

    if (to?.matches.some((_route, depth) => isRouteUpdate(to, from, depth))) {
      hooks.onBeforeRouteUpdate.push(...globalHooks.onBeforeRouteUpdate)
    }

    if (from?.matches.some((_route, depth) => isRouteLeave(to, from, depth))) {
      hooks.onBeforeRouteLeave.push(...globalHooks.onBeforeRouteLeave)
    }
  }

  return hooks
}

export function getGlobalAfterHooks(to: ResolvedRoute | null, from: ResolvedRoute | null, globalStores: Hooks[]): Hooks {
  const hooks = new Hooks()

  for (const globalHooks of globalStores) {
    if (to?.matches.some((_route, depth) => isRouteEnter(to, from, depth))) {
      hooks.onAfterRouteEnter.push(...globalHooks.onAfterRouteEnter)
    }

    if (to?.matches.some((_route, depth) => isRouteUpdate(to, from, depth))) {
      hooks.onAfterRouteUpdate.push(...globalHooks.onAfterRouteUpdate)
    }

    if (from?.matches.some((_route, depth) => isRouteLeave(to, from, depth))) {
      hooks.onAfterRouteLeave.push(...globalHooks.onAfterRouteLeave)
    }
  }

  return hooks
}
