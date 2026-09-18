import { UrlPart, UrlQueryPart } from '@/services/withParams'
import { AliasTransform } from '@/types/routeAlias'
import { CreatedRouteOptions } from '@/types/route'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { ToUrl, Url, UrlParamsReading, UrlParamsWriting } from '@/types/url'
import { LastInArray } from '@/types/utilities'

/**
 * The url of the route's own segment: its own path, query, and hash without any ancestors. An alias
 * replaces the path of this segment, so its params are what an alias transform has to produce.
 */
type OwnSegmentUrl<
  TMatches extends CreatedRouteOptions[],
  TPath = SegmentPath<TMatches>
> = CreatedRouteOptions[] extends TMatches
  ? Url
  : ToUrl<{
    path: TPath extends string | UrlPart | undefined ? TPath : undefined,
    query: SegmentQuery<TMatches>,
    hash: SegmentHash<TMatches>,
  }>

type SegmentPath<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { path: infer TPath extends string | UrlPart | undefined } ? TPath : undefined
type SegmentQuery<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { query: infer TQuery extends string | UrlQueryPart | undefined } ? TQuery : undefined
type SegmentHash<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { hash: infer THash extends string | UrlPart | undefined } ? THash : undefined

/**
 * The params an alias pattern parses from a url, as read. The alias keeps the route's own query and hash.
 */
type AliasParams<
  TPattern extends string | UrlPart,
  TMatches extends CreatedRouteOptions[]
> = UrlParamsReading<OwnSegmentUrl<TMatches, TPattern>>

/**
 * The params the route's own segment declares, as written. What an alias transform returns.
 */
type SegmentParams<
  TMatches extends CreatedRouteOptions[]
> = UrlParamsWriting<OwnSegmentUrl<TMatches>>

/**
 * The transform argument for `addAlias`. Optional only when the alias's params already satisfy the
 * segment's, since matched values pass straight through then. A shape mismatch has to be resolved at
 * declaration time: parsing walks the params declared on the pattern doing the parsing, so a mismatch
 * would silently read a promised param as undefined instead of failing.
 */
type AddAliasArgs<
  TPattern extends string | UrlPart,
  TMatches extends CreatedRouteOptions[]
> = AliasParams<TPattern, TMatches> extends SegmentParams<TMatches>
  ? [transform?: AliasTransform<AliasParams<TPattern, TMatches>, SegmentParams<TMatches>>]
  : [transform: AliasTransform<AliasParams<TPattern, TMatches>, SegmentParams<TMatches>>]

/**
 * Adds an alias to a route. Chainable to register several.
 */
export type RouteAddAlias<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  /**
   * Adds a path the route also matches. The address bar keeps the alias; the route resolves as if its own
   * path had matched. Aliases only match inbound urls: links and navigation always target the route's own
   * path.
   *
   * The pattern replaces this route's own path segment and composes with any aliases of its ancestors.
   * It can declare its own params, typed like a route path with `withParams`.
   *
   * @param pattern - The path pattern to also match.
   * @param transform - Maps the alias's params into the params this route's own segment declares.
   * Required unless the alias's params already satisfy them.
   */
  addAlias: <
    const TPattern extends string | UrlPart
  >(
    pattern: TPattern,
    ...args: AddAliasArgs<TPattern, TMatches>
  ) => RouteWithMethods<TUrl, TMatches>,
}
