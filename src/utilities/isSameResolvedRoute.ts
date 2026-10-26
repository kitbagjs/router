import { ResolvedRoute } from '@/types/resolved'

export function isSameResolvedRoute(route: ResolvedRoute | undefined, other: ResolvedRoute | undefined): boolean {
  return route?.id === other?.id && route?.href === other?.href
}
