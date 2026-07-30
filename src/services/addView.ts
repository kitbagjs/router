import { Component, markRaw } from 'vue'
import { DEFAULT_VIEW_NAME } from '@/services/createRouteViews'
import { PropsGetter } from '@/types/createRouteOptions'
import { PrefetchConfig } from '@/types/prefetch'
import { Route } from '@/types/route'
import { withMatched } from '@/services/withMatched'
import { RouteViews } from '@/types/routeViews'

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

type View = {
  name: string,
  component: Component,
  props: PropsGetter | undefined,
  prefetch: PrefetchConfig | undefined,
}

function toView(component: Component, options: ViewOptions | undefined): View {
  return {
    name: options?.name ?? DEFAULT_VIEW_NAME,
    component,
    props: options?.props,
    prefetch: options?.prefetch,
  }
}

/**
 * Returns a new {@link RouteViews} with a view merged in under its name.
 */
function addToViews(views: RouteViews, { name, component, props, prefetch }: View): RouteViews {
  return {
    ...views,
    [name]: { component, props, prefetch },
  }
}

/**
 * The loose runtime signature of the `addView` method. Purposely wide: it returns Route rather than the
 * refined chainable route each `RouteAddView` overload describes.
 */
type AddView = (...args: AddViewParameters) => Route

/**
 * Attaches a chainable, immutable `addView` method to a route. Each call adds a view to the route's own
 * (last) `views` entry and returns a new route with the view merged in and `addView` re-attached — no
 * mutation of the input route.
 */
export function withAddView<TRoute extends Route>(route: TRoute): TRoute {
  const addView: AddView = (component, options) => {
    const view = toView(component, options)
    const currentMatch = route.matches.at(-1)

    if (!currentMatch) {
      return withAddView(route)
    }

    const nextMatch = markRaw({ ...currentMatch, views: addToViews(currentMatch.views, view) })

    return withAddView(withMatched({
      ...route,
      matches: [...route.matches.slice(0, -1), nextMatch],
    }))
  }

  return {
    ...route,
    addView,
  }
}
