import { ComputedRef } from 'vue'
import { ResolvedRoute } from '@/types/resolved'

/**
 * The navigation under way, if any, and how far it has come. A navigation is under way from the moment it
 * is asked for until the route it leads to has everything it renders with, or it is rejected, aborted, or
 * superseded. Its progress is counted in the units of work it waits on: its before hooks, its props getters
 * and loaders, and the async components it renders. Every unit counts the same.
 */
export type UseNavigation = {
  /**
   * True while a navigation is under way.
   */
  pending: ComputedRef<boolean>,
  /**
   * The route the navigation under way leads to. Null when idle, or when the url matches no route.
   */
  to: ComputedRef<ResolvedRoute | null>,
  /**
   * The route the navigation under way leaves. Null when idle, or for the first navigation.
   */
  from: ComputedRef<ResolvedRoute | null>,
  /**
   * How many units have settled so far. Equal to `total` once a navigation reaches its route, and zero
   * once one ends by being rejected or aborted.
   */
  settled: ComputedRef<number>,
  /**
   * How many units the navigation waits on in all. Known up front except for before hooks, which are
   * added as they start.
   */
  total: ComputedRef<number>,
  /**
   * The share of units settled, between 0 and 1. Zero while idle.
   */
  progress: ComputedRef<number>,
}
