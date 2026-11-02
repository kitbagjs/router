import { ValueLocation } from '@/services/getComputations'
import { ResolvedRoute } from '@/types/resolved'
import { warn } from '@/utilities/warn'

export function warnWaitingOnUncomputedValue({ kind, name }: ValueLocation, route: ResolvedRoute): void {
  const routeName = route.name || 'unknown'
  const value = `${kind} "${name}"`

  warn(`
    Waiting on ${value} for route "${routeName}" before anything is computing it.
    It cannot resolve until it is computed — by its own prefetch strategy, or by navigating. When
    prefetching, prefetch it with the same strategy to avoid stalling here.
  `)
}
