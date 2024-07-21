import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'

type ExternalChildRoutes = Route<string, never>[]

export type ExternalRouteParentProps = {
  /**
   * Represents the host for this route. Used for external routes.
  */
  host?: string | Host,
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: string,
  /**
   * Disabled routes will not ever match but can still provide physical structure, nested children behave normally.
   */
  disabled?: boolean,
  /**
   * Path part of URL.
   */
  path?: string | Path,
  /**
   * Query (aka search) part of URL.
   */
  query?: string | Query,
  /**
   * Children routes, expected type comes from `createExternalRoutes()`
   */
  children: ExternalChildRoutes,
}

export type ExternalRouteChildProps = {
  /**
   * Represents the host for this route. Used for external routes.
  */
  host?: string | Host,
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name: string,
  /**
   * Children routes, expected type comes from `createRoutes()`
   */
  disabled?: boolean,
  /**
   * Path part of URL.
   */
  path?: string | Path,
  /**
   * Query (aka search) part of URL.
   */
  query?: string | Query,
  /**
   * Children routes, cannot have a value for a child route.
  */
  // never here important to keep a ExternalRouteParentProps with incorrect children from matching this type
  children?: never,
}

export type ExternalRouteProps = ExternalRouteParentProps | ExternalRouteChildProps