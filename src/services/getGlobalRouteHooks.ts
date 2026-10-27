import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from './hooks'
import { Hooks } from '@/models/hooks'

export function getGlobalBeforeHooks(to: ResolvedRoute | null, from: ResolvedRoute | null, globalStores: Hooks[]): Hooks {
  const hooks = new Hooks()

  for (const globalHooks of globalStores) {
    if (to?.matches.some((_route, depth) => isRouteEnter(to, from, depth))) {
      hooks.add(globalHooks, 'onBeforeRouteEnter')
    }

    if (to?.matches.some((_route, depth) => isRouteUpdate(to, from, depth))) {
      hooks.add(globalHooks, 'onBeforeRouteUpdate')
    }

    if (from?.matches.some((_route, depth) => isRouteLeave(to, from, depth))) {
      hooks.add(globalHooks, 'onBeforeRouteLeave')
    }
  }

  return hooks
}

export function getGlobalAfterHooks(to: ResolvedRoute | null, from: ResolvedRoute | null, globalStores: Hooks[]): Hooks {
  const hooks = new Hooks()

  for (const globalHooks of globalStores) {
    if (to?.matches.some((_route, depth) => isRouteEnter(to, from, depth))) {
      hooks.add(globalHooks, 'onAfterRouteEnter')
    }

    if (to?.matches.some((_route, depth) => isRouteUpdate(to, from, depth))) {
      hooks.add(globalHooks, 'onAfterRouteUpdate')
    }

    if (from?.matches.some((_route, depth) => isRouteLeave(to, from, depth))) {
      hooks.add(globalHooks, 'onAfterRouteLeave')
    }
  }

  return hooks
}
