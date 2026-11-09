import { HookLifecycle } from '@/types/hooks'
import { Resolved } from '@/types/resolved'

type RouteHookCondition = (to: Resolved | null, from: Resolved | null, depth: number) => boolean

export const isRouteEnter: RouteHookCondition = (to, from, depth) => {
  const toMatches = to?.views ?? []
  const fromMatches = from?.views ?? []

  return toMatches.at(depth)?.id !== fromMatches.at(depth)?.id
}

export const isRouteLeave: RouteHookCondition = (to, from, depth) => {
  const toMatches = to?.views ?? []
  const fromMatches = from?.views ?? []

  return toMatches.at(depth)?.id !== fromMatches.at(depth)?.id
}

export const isRouteUpdate: RouteHookCondition = (to, from, depth) => {
  return to?.views.at(depth)?.id === from?.views.at(depth)?.id
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
