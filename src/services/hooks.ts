import { HookLifecycle } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'

type RouteHookCondition = (to: ResolvedRoute, from: ResolvedRoute | null, depth: number) => boolean

export const isRouteEnter: RouteHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.at(depth)?.id !== fromMatches.at(depth)?.id
}

export const isRouteLeave: RouteHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.at(depth)?.id !== fromMatches.at(depth)?.id
}

export const isRouteUpdate: RouteHookCondition = (to, from, depth) => {
  return to.matches.at(depth)?.id === from?.matches.at(depth)?.id
}

export function getRouteHookCondition(lifecycle: HookLifecycle): RouteHookCondition {
  switch (lifecycle) {
    case 'onBeforeRouteEnter':
    case 'onAfterRouteEnter':
      return isRouteEnter
    case 'onBeforeRouteUpdate':
    case 'onAfterRouteUpdate':
      return isRouteUpdate
    case 'onBeforeRouteLeave':
    case 'onAfterRouteLeave':
      return isRouteLeave
    default:
      throw new Error(`Switch is not exhaustive for lifecycle: ${lifecycle satisfies never}`)
  }
}
