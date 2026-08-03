import { Component, markRaw } from 'vue'
import { DEFAULT_VIEW_NAME } from '@/services/createRouteViews'
import { PropsGetter } from '@/types/createRouteOptions'
import { PrefetchConfig } from '@/types/prefetch'
import { CreatedRouteOptions, Route } from '@/types/route'

/**
 * The loose runtime shape of the `addView` options. Purposely wide: the getter and name types each
 * `RouteAddView` describes are refined per route and component.
 */
type ViewOptions = {
  name?: string,
  props?: PropsGetter,
  prefetch?: PrefetchConfig,
}

/**
 * The runtime arguments accepted by `addView`.
 */
type AddViewParameters = [component: Component, options?: ViewOptions]

/**
 * The loose runtime signature of the `addView` method. Purposely wide: it returns Route rather than the
 * refined chainable route each `RouteAddView` overload describes.
 */
export type AddView = (...args: AddViewParameters) => Route

type View = {
  name: string,
  component: Component,
  props: PropsGetter | undefined,
  prefetch: PrefetchConfig | undefined,
}

export function toView(component: Component, options: ViewOptions | undefined): View {
  return {
    name: options?.name ?? DEFAULT_VIEW_NAME,
    component,
    props: options?.props,
    prefetch: options?.prefetch,
  }
}

/**
 * Returns a new match with the view merged into its views under the view's name.
 *
 * Matches are `markRaw` so that making a route reactive does not turn its components into reactive
 * proxies. Spreading a match drops that, so the rebuilt one is marked again.
 */
export function addViewToMatch(match: CreatedRouteOptions, { name, component, props, prefetch }: View): CreatedRouteOptions {
  return markRaw({
    ...match,
    views: {
      ...match.views,
      [name]: { component, props, prefetch },
    },
  })
}
