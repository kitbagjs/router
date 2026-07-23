import { Component } from 'vue'

/**
 * The components and prop getters for a single route, keyed by view name (the default view under
 * 'default'). This is a first-class structure on the route, indexed by depth in `route.views` —
 * parallel to how `route.matches` indexes the matched options. It is the single source of truth for
 * a route's components and prop getters; `matched` no longer carries them.
 *
 * @template TProps - The prop getter types for this route's views. A bare getter for a single default
 * view, or a record keyed by view name. Carries the getter types used for parent props typing.
 */
export type RouteViews<TProps = unknown> = {
  /**
   * The id of the route these views belong to. Matches the corresponding `matched.id` at the same depth.
   */
  id: string,
  /**
   * Components to render, keyed by view name. Empty when the route renders a nested RouterView.
   */
  components: Record<string, Component>,
  /**
   * Prop getters for the route's views.
   */
  props: TProps,
}
