import { CreateRouteOptions } from '@/services/createRoute'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { RouteMeta } from '@/types/register'

/**
 * Represents an immutable array of Route instances. Return value of `createRoute`, expected param for `createRouter`.
 */
export type Routes = Readonly<Route[]>

/**
 * The Route properties originally provided to `createRoute`. The only change is normalizing meta to always default to an empty object.
 */
export type CreateRouteOptionsWithMeta = CreateRouteOptions & { meta: RouteMeta }

/**
 * Represents the structure of a route within the application. Return value of `createRoute`
 * @template TKey - Represents the unique key identifying the route, typically a string.
 * @template TPath - The type or structure of the route's path.
 * @template TQuery - The type or structure of the query parameters associated with the route.
 * @template TDisabled - Indicates whether the route is disabled, which could affect routing logic.
 */
export type Route<
  TKey extends string = string,
  THost extends Host = Host,
  TPath extends Path = Path,
  TQuery extends Query = Query,
  TDisabled extends boolean = boolean
> = {
  /**
   * The specific route properties that were matched in the current route.
  */
  matched: CreateRouteOptionsWithMeta,
  /**
   * The specific route properties that were matched in the current route, including any ancestors.
   * Order of routes will be from greatest ancestor to narrowest matched.
  */
  matches: CreateRouteOptionsWithMeta[],
  /**
   * Unique identifier for the route, generated by joining route `name` by period. Key is used for routing and for matching.
  */
  key: TKey,
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
  depth: number,
  /**
   * Indicates if the route is disabled.
  */
  disabled: TDisabled,
}
