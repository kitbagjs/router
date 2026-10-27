import { ResolvedRoute } from '@/types/resolved'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from './hooks'
import { Hooks } from '@/models/hooks'
import { HooksCollection } from '@/types/hooksCollection'
import { createHooksCollection } from '@/services/createHooksCollection'

export function getGlobalBeforeHooks(to: ResolvedRoute | null, from: ResolvedRoute | null, globalStores: Hooks[]): HooksCollection {
  const hooks = createHooksCollection()

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

export function getGlobalAfterHooks(to: ResolvedRoute | null, from: ResolvedRoute | null, globalStores: Hooks[]): HooksCollection {
  const hooks = createHooksCollection()

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
