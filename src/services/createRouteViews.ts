import { Component } from 'vue'
import { CreateRouteOptions, CreateRouteProps, isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { RouteViews } from '@/types/routeViews'

export const DEFAULT_VIEW_NAME = 'default'

/**
 * Builds the initial views for a route, seeding components from the (deprecated) `component`/`components`
 * options and prop getters from the props argument. Subsequent views are added via the route's `addView`.
 */
export function createRouteViews(id: string, options: CreateRouteOptions, props?: CreateRouteProps): RouteViews {
  const components: Record<string, Component> = {}

  /* eslint-disable @typescript-eslint/no-deprecated -- seeds views from the deprecated component/components options */
  if (isWithComponents(options)) {
    Object.assign(components, options.components)
  } else if (isWithComponent(options)) {
    components[DEFAULT_VIEW_NAME] = options.component
  }
  /* eslint-enable @typescript-eslint/no-deprecated */

  return { id, components, props }
}
