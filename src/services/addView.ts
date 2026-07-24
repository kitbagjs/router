import { Component } from 'vue'
import { DEFAULT_VIEW_NAME } from '@/services/createRouteViews'
import { PropsGetter } from '@/types/createRouteOptions'
import { Route } from '@/types/route'
import { RouteViews } from '@/types/routeViews'

type DefaultViewArgs = [component: Component, props?: PropsGetter]
type NamedViewArgs = [name: string, component: Component, props?: PropsGetter]

/**
 * The runtime arguments accepted by `addView`: a default view (component first) or a named view (name first).
 */
type AddViewParameters = DefaultViewArgs | NamedViewArgs

type NamedView = {
  name: string,
  component: Component,
  props: PropsGetter | undefined,
}

/**
 * Whether the `addView` arguments are for a named view (a name string as the first argument) rather than
 * the default view (a component as the first argument).
 */
function isNamedView(args: AddViewParameters): args is NamedViewArgs {
  return typeof args[0] === 'string'
}

/**
 * Normalizes `addView` arguments into a `{ name, component, props }` view, defaulting the name to 'default'.
 */
function toNamedView(args: AddViewParameters): NamedView {
  if (isNamedView(args)) {
    const [name, component, props] = args

    return { name, component, props }
  }

  const [component, props] = args

  return { name: DEFAULT_VIEW_NAME, component, props }
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
 * Returns a new {@link RouteViews} with a view (component + optional props getter) merged in. Components
 * are always stored as a record; props keep the bare getter for a lone default view and promote to a
 * record once a named view is added (pulling any existing bare default under 'default').
 */
function addToViews(views: RouteViews, name: string, component: Component, props: PropsGetter | undefined): RouteViews {
  return {
    id: views.id,
    components: { ...views.components, [name]: component },
    props: addProps(views.props as ViewProps, name, props),
  }
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
  const addView: AddView = (...args) => {
    const { name, component, props } = toNamedView(args)
    const currentViews = route.views.at(-1)

    if (!currentViews) {
      return withAddView(route)
    }

    const nextViews = addToViews(currentViews, name, component, props)

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
