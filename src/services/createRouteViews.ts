import { CreateRouteOptions, CreateRouteProps, isWithComponent, isWithComponents, PropsGetter } from '@/types/createRouteOptions'
import { RouteView, RouteViews } from '@/types/routeViews'

export const DEFAULT_VIEW_NAME = 'default'

/**
 * Builds the initial views for a route, seeding components from the (deprecated) `component`/`components`
 * options and prop getters from the props argument. Subsequent views are added via the route's `addView`.
 *
 * This is where the props argument's two shapes — a single getter for the unnamed view, or a record keyed
 * by view name — are normalized, so the rest of the router only deals with views keyed by name.
 */
export function createRouteViews(id: string, options: CreateRouteOptions, props?: CreateRouteProps): RouteViews {
  const views: Record<string, RouteView> = {}

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

  return { id, views }
}
