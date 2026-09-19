import { UrlPart, UrlQueryPart } from '@/services/withParams'
import { AliasTransform } from '@/types/routeAlias'
import { CreatedRouteOptions } from '@/types/route'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { ToUrl, Url, UrlParamsReading, UrlParamsWriting } from '@/types/url'
import { LastInArray } from '@/types/utilities'

/**
 * The url an alias matches, in the same shapes `createRoute` takes. An alias declares its whole url:
 * nothing is taken from the route's own path, query, or hash.
 */
export type AddAliasOptions = {
  /**
   * Path part of the alias.
   */
  path?: string | UrlPart | undefined,
  /**
   * Query (aka search) part of the alias.
   */
  query?: string | UrlQueryPart | undefined,
  /**
   * Hash part of the alias.
   */
  hash?: string | UrlPart | undefined,
}

type PathPart = string | UrlPart | undefined
type QueryPart = string | UrlQueryPart | undefined

type SegmentPath<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { path: infer TPath extends PathPart } ? TPath : undefined
type SegmentQuery<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { query: infer TQuery extends QueryPart } ? TQuery : undefined
type SegmentHash<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { hash: infer THash extends PathPart } ? THash : undefined

/**
 * The url of the route's own segment: its own path, query, and hash without any ancestors. An alias
 * stands in for this segment, so its params are what an alias transform has to produce.
 */
type SegmentUrl<
  TMatches extends CreatedRouteOptions[]
> = CreatedRouteOptions[] extends TMatches
  ? Url
  : ToUrl<{
    path: SegmentPath<TMatches>,
    query: SegmentQuery<TMatches>,
    hash: SegmentHash<TMatches>,
  }>

/**
 * The params an alias parses from a url, as read.
 */
type AliasParams<
  TOptions extends AddAliasOptions
> = UrlParamsReading<ToUrl<TOptions>>

/**
 * The params the route's own segment declares, as written. What an alias transform returns.
 */
type SegmentParams<
  TMatches extends CreatedRouteOptions[]
> = UrlParamsWriting<SegmentUrl<TMatches>>

/**
 * The transform argument for `addAlias`. Optional only when the alias's params already satisfy the
 * segment's, since matched values pass straight through then. A shape mismatch has to be resolved at
 * declaration time: parsing walks the params declared on the pattern doing the parsing, so a mismatch
 * would silently read a promised param as undefined instead of failing.
 */
type AddAliasArgs<
  TOptions extends AddAliasOptions,
  TMatches extends CreatedRouteOptions[]
> = AliasParams<TOptions> extends SegmentParams<TMatches>
  ? [transform?: AliasTransform<AliasParams<TOptions>, SegmentParams<TMatches>>]
  : [transform: AliasTransform<AliasParams<TOptions>, SegmentParams<TMatches>>]

/**
 * Adds an alias to a route. Chainable to register several.
 */
export type RouteAddAlias<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  /**
   * Adds a url the route also matches. The address bar keeps the alias; the route resolves as if its own
   * url had matched. Aliases only match inbound urls: links and navigation always target the route's own
   * url.
   *
   * The alias stands in for this route's own path, query, and hash, and composes with any aliases of the
   * route's ancestors. It declares its own params, typed the same way a route's are, and any param the
   * route's own segment declares that the alias does not is the transform's to supply.
   *
   * @param options - The alias's `path`, `query`, and `hash`, each taking what `createRoute` does.
   * @param transform - Maps the alias's params into the params this route's own segment declares.
   * Required unless the alias's params already satisfy them.
   */
  addAlias: <
    const TOptions extends AddAliasOptions
  >(
    options: TOptions,
    ...args: AddAliasArgs<TOptions, TMatches>
  ) => RouteWithMethods<TUrl, TMatches>,
}
