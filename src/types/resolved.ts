import { ExtractRouteParamTypesWithOptional } from '@/types/params'
import { Route } from '@/types/route'
import { ExtractRouteStateParamsAsOptional } from '@/types/state'
import { Url } from '@/types/url'

/**
 * Represents a route that the router has matched to current browser location.
 * @template TRoute - Underlying Route that has been resolved.
 */
export type ResolvedRoute<TRoute extends Route = Route> = Readonly<{
  /**
   * Unique identifier for the route, generated by router.
  */
  id: TRoute['id'],
  /**
   * The specific route properties that were matched in the current route.
  */
  matched: TRoute['matched'],
  /**
   * The specific route properties that were matched in the current route, including any ancestors.
   * Order of routes will be from greatest ancestor to narrowest matched.
  */
  matches: TRoute['matches'],
  /**
   * Unique identifier for the route. Name is used for routing and for matching.
  */
  name: TRoute['name'],
  /**
   * Accessor for query string values from user in the current browser location.
  */
  query: URLSearchParams,
  /**
   * Hash value of the route.
  */
  hash: string,
  /**
   * Key value pair for route params, values will be the user provided value from current browser location.
  */
  params: ExtractRouteParamTypesWithOptional<TRoute>,
  /**
   * Type for additional data intended to be stored in history state.
   */
  state: ExtractRouteStateParamsAsOptional<TRoute['state']>,
  /**
   * String value of the resolved URL.
   */
  href: Url,
}>
