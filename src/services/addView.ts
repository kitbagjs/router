import { Component, markRaw } from 'vue'
import { DEFAULT_VIEW_NAME } from '@/services/routeViews'
import { AnyPayloadTransformer } from '@/services/payload'
import { AddViewPropsGetter } from '@/types/addView'
import { PrefetchConfig } from '@/types/prefetch'
import { CreatedRouteOptions, Route } from '@/types/route'
import { AnyView, isView } from '@/types/view'
import { combineContext } from '@/services/combineContext'
import { RouteContext } from '@/types/routeContext'

/**
 * The loose runtime shape of the `addView` options. Purposely wide: the getter and name types each
 * `RouteAddView` describes are refined per route and component.
 */
type ViewOptions = {
  name?: string,
  props?: AddViewPropsGetter<Route, Component>,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

/**
 * The runtime arguments accepted by `addView`.
 */
type AddViewParameters = [component: Component | AnyView, options?: ViewOptions]

/**
 * The loose runtime signature of the `addView` method. Purposely wide: it returns Route rather than the
 * refined chainable route each `RouteAddView` overload describes.
 */
export type AddView = (...args: AddViewParameters) => Route

type View = {
  context?: readonly RouteContext[],
  name: string,
  component: Component,
  props?: AddViewPropsGetter<Route, Component>,
  prefetch: PrefetchConfig | undefined,
  transformer: AnyPayloadTransformer | undefined,
}

export function toView(source: Component | AnyView, options: ViewOptions | undefined): View {
  if (!isView(source)) {
    return {
      name: options?.name ?? DEFAULT_VIEW_NAME,
      component: source,
      props: options?.props,
      prefetch: options?.prefetch,
      transformer: options?.transformer,
    }
  }

  return {
    ...source,
    name: options?.name ?? DEFAULT_VIEW_NAME,
    prefetch: options?.prefetch ?? source.prefetch,
    transformer: options?.transformer ?? source.transformer,
  }
}

/**
 * Returns a new match with the view merged into its views under the view's name.
 *
 * Matches are `markRaw` so that making a route reactive does not turn its components into reactive
 * proxies. Spreading a match drops that, so the rebuilt one is marked again.
 */
export function addViewToMatch(match: CreatedRouteOptions, { name, ...view }: View): CreatedRouteOptions {
  return markRaw({
    ...match,
    context: combineContext(match.context, view.context),
    views: {
      ...match.views,
      [name]: view,
    },
  })
}
