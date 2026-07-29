import { Component } from 'vue'
import { DEFAULT_VIEW_NAME } from '@/services/createRouteViews'
import { PropsGetter } from '@/types/createRouteOptions'
import { PrefetchConfig } from '@/types/prefetch'
import { Route } from '@/types/route'
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

type NamedView = {
  name: string,
  component: Component,
  props: PropsGetter | undefined,
  prefetch: PrefetchConfig | undefined,
}

/**
 * Normalizes `addView` arguments into a `{ name, component, props, prefetch }` view, defaulting the
 * name to 'default'.
 */
function toNamedView(component: Component, options: ViewOptions | undefined): NamedView {
  return {
    name: options?.name ?? DEFAULT_VIEW_NAME,
    component,
    props: options?.props,
    prefetch: options?.prefetch,
  }
}

/**
 * The runtime shape of a view's prop getters: a bare getter for a lone default view, a record keyed by
 * view name, or undefined when no getter has been provided.
 */
type ViewProps = PropsGetter | Record<string, PropsGetter> | undefined

function isBareProps(props: ViewProps): props is PropsGetter {
  return typeof props === 'function'
}

function isPropsRecord(props: ViewProps): props is Record<string, PropsGetter> {
  return typeof props === 'object'
}

/**
 * Normalizes view props into a record, moving a bare default getter under the 'default' key.
 */
function toPropsRecord(props: ViewProps): Record<string, PropsGetter> {
  if (isPropsRecord(props)) {
    return { ...props }
  }

  if (isBareProps(props)) {
    return { [DEFAULT_VIEW_NAME]: props }
  }

  return {}
}

/**
 * Returns a new {@link RouteViews} with a view (component + optional props getter + optional per-view
 * settings) merged in. Components and prefetch configs are always stored as records keyed by view name;
 * props keep the bare getter for a lone default view and promote to a record once a named view is added
 * (pulling any existing bare default under 'default').
 */
function addToViews(views: RouteViews, { name, component, props, prefetch }: NamedView): RouteViews {
  return {
    id: views.id,
    components: { ...views.components, [name]: component },
    props: addProps(views.props as ViewProps, name, props),
    prefetch: addPrefetch(views.prefetch, name, prefetch),
  }
}

/**
 * Merges a view's prefetch config into the record keyed by view name. Views without their own config are
 * left absent so they fall back to the route's config.
 */
function addPrefetch(current: RouteViews['prefetch'], name: string, prefetch: PrefetchConfig | undefined): RouteViews['prefetch'] {
  if (prefetch === undefined) {
    return current
  }

  return { ...current, [name]: prefetch }
}

function addProps(current: ViewProps, name: string, props: PropsGetter | undefined): ViewProps {
  if (props === undefined) {
    return current
  }

  if (name === DEFAULT_VIEW_NAME && !isPropsRecord(current)) {
    return props
  }

  return { ...toPropsRecord(current), [name]: props }
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
    const view = toNamedView(component, options)
    const currentViews = route.views.at(-1)

    if (!currentViews) {
      return withAddView(route)
    }

    const nextViews = addToViews(currentViews, view)

    return withAddView({
      ...route,
      views: [...route.views.slice(0, -1), nextViews],
    })
  }

  return {
    ...route,
    addView,
  }
}
