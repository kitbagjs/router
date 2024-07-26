import { Component } from 'vue'
import { combineKey } from '@/services/combineKey'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybeArray } from '@/types/utilities'

/**
 * Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.
 */
export type WithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

export type WithParent<TParent extends Route = Route> = {
  parent: TParent,
}

export function isWithParent<T extends Record<string, unknown>>(options: T): options is T & WithParent {
  return 'parent' in options && Boolean(options.parent)
}

export type WithoutParent = {
  parent?: never,
}

export type WithComponent<
  TComponent extends Component | undefined = Component | undefined
> = {
  component?: TComponent,
}

export function isWithComponent(options: CreateRouteOptions): options is CreateRouteOptions & { component: Component } {
  return 'component' in options && Boolean(options.component)
}

export type WithComponents<
  TComponents extends Record<string, Component> | undefined = Record<string, Component> | undefined
> = {
  components?: TComponents,
}

export function isWithComponents(options: CreateRouteOptions): options is CreateRouteOptions & { components: Record<string, Component> } {
  return 'components' in options && Boolean(options.components)
}

export type CreateRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined
> = {
  name?: TName,
  path?: TPath,
  query?: TQuery,
  meta?: RouteMeta,
}

export function combineRoutes(parent: Route, child: Route): Route {
  return {
    ...child,
    key: combineKey(parent.key, child.key),
    path: combinePath(parent.path, child.path),
    query: combineQuery(parent.query, child.query),
    matches: [...parent.matches, child.matched],
    host: parent.host,
    depth: parent.depth + 1,
  }
}