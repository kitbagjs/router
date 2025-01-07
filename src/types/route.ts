import { Component } from 'vue'
import { CreateRouteOptions, WithoutState, WithState } from '@/types/createRouteOptions'
import { Hash, ToHash } from '@/types/hash'
import { Host } from '@/types/host'
import { Param } from '@/types/paramTypes'
import { Path, ToPath } from '@/types/path'
import { PrefetchConfig } from '@/types/prefetch'
import { Query, ToQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { WithHooks } from './hooks'
import { ToName } from './name'

/**
 * Represents an immutable array of Route instances. Return value of `createRoute`, expected param for `createRouter`.
 */
export type Routes = readonly Route[]

export type ToMeta<TMeta extends RouteMeta | undefined> = TMeta extends undefined ? {} : TMeta
export type ToState<TState extends Record<string, Param> | undefined> = TState extends undefined ? Record<string, Param> : TState

export type CreatedRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends Path | undefined = Path | undefined,
  TQuery extends Query | undefined = Query | undefined,
  THash extends Hash | undefined = Hash | undefined,
  TMeta extends RouteMeta = RouteMeta,
  TState extends Record<string, Param> = Record<string, Param>,
  TComponents extends Record<string, Component> = Record<string, Component>
> = CreateRouteOptions<ToName<TName>, ToPath<TPath>, ToQuery<TQuery>, ToHash<THash>, ToMeta<TMeta>, ToState<TState>> & {
  id: string,
  component: TComponents,
}

/**
 * Represents the structure of a route within the application. Return value of `createRoute`
 * @template TName - Represents the unique name identifying the route, typically a string.
 * @template TPath - The type or structure of the route's path.
 * @template TQuery - The type or structure of the query parameters associated with the route.
 */
export type Route<
  TName extends string = string,
  THost extends Host = Host,
  TPath extends Path = Path,
  TQuery extends Query = Query,
  THash extends Hash = Hash,
  TMeta extends RouteMeta = RouteMeta,
  TState extends Record<string, Param> = Record<string, Param>,
  TComponents extends Record<string, Component> = Record<string, Component>,
  TParentMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  /**
   * Unique identifier for the route, generated by router.
  */
  id: string,
  /**
   * The specific route properties that were matched in the current route.
  */
  matched: CreatedRouteOptions<TName, TPath, TQuery, THash, TMeta, TState, TComponents>,
  /**
   * The specific route properties that were matched in the current route, including any ancestors.
   * Order of routes will be from greatest ancestor to narrowest matched.
  */
  matches: [...TParentMatches, CreatedRouteOptions<TName, TPath, TQuery, THash, TMeta, TState, TComponents>],
  /**
   * Identifier for the route as defined by user. Name must be unique among named routes. Name is used for routing and for matching.
  */
  name: TName,
  /**
   * Represents the host for this route. Used for external routes.
  */
  host: THost,
  /**
   * Represents the structured path of the route, including path params.
  */
  path: TPath,
  /**
   * Represents the structured query of the route, including query params.
  */
  query: TQuery,
  /**
   * Represents the hash of the route.
   */
  hash: THash,
  /**
   * Represents additional metadata associated with a route, combined with any parents.
  */
  meta: TMeta,
  /**
   * Represents the schema of the route state, combined with any parents.
  */
  state: TState,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch.
  */
  prefetch?: PrefetchConfig,
  /**
  * A value that represents how many parents a route has. Used for route matching
  * @internal
  */
  depth: number,
}
