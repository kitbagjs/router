import { UrlPart, UrlQueryPart } from '@/services/withParams'
import { AliasTransform } from '@/types/routeAlias'
import { CreatedRouteOptions } from '@/types/route'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { ToUrl, Url, UrlParamsReading, UrlParamsWriting } from '@/types/url'
import { LastInArray } from '@/types/utilities'

/**
 * The parts of an alias, each replacing the route's own when given. Takes the same shapes `createRoute`
 * does.
 */
export type AddAliasOptions = {
  /**
   * Path part of the alias. Defaults to the route's own path.
   */
  path?: string | UrlPart | undefined,
  /**
   * Query (aka search) part of the alias. Defaults to the route's own query.
   */
  query?: string | UrlQueryPart | undefined,
  /**
   * Hash part of the alias. Defaults to the route's own hash.
   */
  hash?: string | UrlPart | undefined,
}

/**
 * What `addAlias` accepts: a path pattern on its own, or the alias's parts as an options object.
 */
export type AliasPattern = string | UrlPart | AddAliasOptions

type PathPart = string | UrlPart | undefined
type QueryPart = string | UrlQueryPart | undefined

type SegmentPath<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { path: infer TPath extends PathPart } ? TPath : undefined
type SegmentQuery<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { query: infer TQuery extends QueryPart } ? TQuery : undefined
type SegmentHash<TMatches extends CreatedRouteOptions[]> = LastInArray<TMatches> extends { hash: infer THash extends PathPart } ? THash : undefined

/**
 * The url of the route's own segment: its own path, query, and hash without any ancestors, with any part
 * replaced by the one given. An alias replaces parts of this segment, so its params are what an alias
 * transform has to produce.
 */
type SegmentUrl<
  TMatches extends CreatedRouteOptions[],
  TPath = SegmentPath<TMatches>,
  TQuery = SegmentQuery<TMatches>,
  THash = SegmentHash<TMatches>
> = CreatedRouteOptions[] extends TMatches
  ? Url
  : ToUrl<{
    path: TPath extends PathPart ? TPath : undefined,
    query: TQuery extends QueryPart ? TQuery : undefined,
    hash: THash extends PathPart ? THash : undefined,
  }>

/**
 * The part an alias options object gives, or the route's own when it does not.
 */
type AliasPart<
  TOptions extends AddAliasOptions,
  TKey extends keyof AddAliasOptions,
  TDefault
> = TOptions extends Record<TKey, infer TPart> ? TPart : TDefault

/**
 * The url an alias matches. A path pattern keeps the route's own query and hash; an options object
 * keeps whichever parts it leaves out.
 */
type AliasUrl<
  TPattern extends AliasPattern,
  TMatches extends CreatedRouteOptions[]
> = TPattern extends string | UrlPart
  ? SegmentUrl<TMatches, TPattern>
  : TPattern extends AddAliasOptions
    ? SegmentUrl<
      TMatches,
      AliasPart<TPattern, 'path', SegmentPath<TMatches>>,
      AliasPart<TPattern, 'query', SegmentQuery<TMatches>>,
      AliasPart<TPattern, 'hash', SegmentHash<TMatches>>
    >
    : Url

/**
 * The params an alias parses from a url, as read.
 */
type AliasParams<
  TPattern extends AliasPattern,
  TMatches extends CreatedRouteOptions[]
> = UrlParamsReading<AliasUrl<TPattern, TMatches>>

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
  TPattern extends AliasPattern,
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
   * Adds a url the route also matches. The address bar keeps the alias; the route resolves as if its own
   * url had matched. Aliases only match inbound urls: links and navigation always target the route's own
   * url.
   *
   * A path pattern replaces this route's own path and keeps its query and hash. An options object
   * replaces whichever of `path`, `query`, and `hash` it carries. Either way the alias composes with any
   * aliases of the route's ancestors, and can declare its own params, typed the same way a route's are.
   *
   * @param pattern - The path pattern to also match, or the alias's parts as an options object.
   * @param transform - Maps the alias's params into the params this route's own segment declares.
   * Required unless the alias's params already satisfy them.
   */
  addAlias: <
    const TPattern extends AliasPattern
  >(
    pattern: TPattern,
    ...args: AddAliasArgs<TPattern, TMatches>
  ) => RouteWithMethods<TUrl, TMatches>,
}
