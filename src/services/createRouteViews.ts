import { RouteViews } from '@/types/routeViews'

export const DEFAULT_VIEW_NAME = 'default'

/**
 * The names of the views that have a props getter. A view without one is never computed, so waiting on it
 * would never settle.
 */
export function viewNamesWithProps(views: RouteViews): string[] {
  return Object.keys(views).filter((name) => views[name].props)
}
