import { CreateRouteOptions, WithComponent, WithComponents, WithHooks, WithHost, WithParent, WithState, WithoutComponents, WithoutHost, WithoutParent, WithoutState } from '@/types/createRouteOptions'
import { Host } from '@/types/host'
import { Param } from '@/types/paramTypes'
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
type CreateRouteOptionsMatched = CreateRouteOptions & WithHooks & (WithHost | WithoutHost) & (WithComponent | WithComponents | WithoutComponents) & (WithParent | WithoutParent) & (WithState | WithoutState) & { meta: RouteMeta }

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
  TMeta extends RouteMeta = RouteMeta,
  TState extends Record<string, Param> = Record<string, Param>
> = {
  /**
   * The specific route properties that were matched in the current route.
  */
  matched: CreateRouteOptionsMatched,
  /**
   * The specific route properties that were matched in the current route, including any ancestors.
   * Order of routes will be from greatest ancestor to narrowest matched.
  */
  matches: CreateRouteOptionsMatched[],
  /**
   * Unique identifier for the route. Name is used for routing and for matching.
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
   * Represents additional metadata associated with a route, combined with any parents.
  */
  meta: TMeta,
  /**
   * Represents the schema of the route state, combined with any parents.
  */
  state: TState,
  depth: number,
}
