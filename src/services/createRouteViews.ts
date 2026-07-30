import { RouteViews } from '@/types/routeViews'

export const DEFAULT_VIEW_NAME = 'default'

/**
 * Whether any of a route's views has a props getter.
 */
export function isWithViewProps(views: RouteViews): boolean {
  return viewNamesWithProps(views).length > 0
}

/**
 * Whether the unnamed view is the only one with props, in which case a child is given those props directly
 * rather than keyed by view name. Views used to store this distinction — a bare getter meant the unnamed
 * view, a record meant named views — so it is asked of them now that they are always keyed by name.
 */
export function isWithBareViewProps(views: RouteViews): boolean {
  const names = viewNamesWithProps(views)

  return names.length === 1 && names[0] === DEFAULT_VIEW_NAME
}

function viewNamesWithProps(views: RouteViews): string[] {
  return Object.keys(views).filter((name) => views[name].props)
}
