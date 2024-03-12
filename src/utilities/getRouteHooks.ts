import { AfterRouteHook, BeforeRouteHook } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { asArray } from '@/utilities/array'
import { isRouteEnter, isRouteLeave, isRouteUpdate } from '@/utilities/hooks'

export function getBeforeRouteHooks(to: ResolvedRoute, from: ResolvedRoute): BeforeRouteHook[] {
  const toHooks = to.matches.flatMap((route, depth) => {
    const hooks = []

    if (route.onBeforeRouteEnter && isRouteEnter(to, from, depth)) {
      hooks.push(...asArray(route.onBeforeRouteEnter))
    }

    if (route.onBeforeRouteUpdate && isRouteUpdate(to, from, depth)) {
      hooks.push(...asArray(route.onBeforeRouteUpdate))
    }

    return hooks
  })

  const fromHooks = from.matches.flatMap((route, depth) => {
    const hooks = []

    if (route.onBeforeRouteLeave && isRouteLeave(to, from, depth)) {
      hooks.push(...asArray(route.onBeforeRouteLeave))
    }

    return hooks
  })

  return [...fromHooks, ...toHooks]
}

export function getAfterRouteHooks(to: ResolvedRoute, from: ResolvedRoute): AfterRouteHook[] {
  return []
}