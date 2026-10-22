import { ResolvedRoute } from '@/types/resolved'
import { setStateValues } from './state'

export function getPrefetchKey(route: ResolvedRoute | undefined): string | undefined {
  if (!route) {
    return
  }

  const state = setStateValues(route.matched.state ?? {}, route.state)

  return JSON.stringify([route.id, route.href, state])
}
