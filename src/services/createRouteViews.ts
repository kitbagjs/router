import { CreateRouteOptions, CreateRouteProps, isWithComponent, isWithComponents, PropsGetter } from '@/types/createRouteOptions'
import { RouteViews } from '@/types/routeViews'

export const DEFAULT_VIEW_NAME = 'default'

/**
 * Builds the initial views for a route, seeding components from the (deprecated) `component`/`components`
 * options and prop getters from the props argument. Subsequent views are added via the route's `addView`.
 *
 * This is where the props argument's two shapes — a single getter for the unnamed view, or a record keyed
 * by view name — are normalized, so the rest of the router only deals with views keyed by name.
 */
export function createRouteViews(options: CreateRouteOptions, props?: CreateRouteProps): RouteViews {
  const views: RouteViews = {}

  /* eslint-disable @typescript-eslint/no-deprecated -- seeds views from the deprecated component/components options */
  if (isWithComponents(options)) {
    Object.entries(options.components).forEach(([name, component]) => {
      views[name] = { component }
    })
  } else if (isWithComponent(options)) {
    views[DEFAULT_VIEW_NAME] = { component: options.component }
  }
  /* eslint-enable @typescript-eslint/no-deprecated */

  if (typeof props === 'function') {
    views[DEFAULT_VIEW_NAME] = { ...views[DEFAULT_VIEW_NAME], props }
  } else {
    // the record form only comes from the deprecated `components` option, which the props type no longer describes
    const byName = props as Record<string, PropsGetter> | undefined

    Object.entries(byName ?? {}).forEach(([name, getter]) => {
      views[name] = { ...views[name], props: getter }
    })
  }

  return views
}

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
