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
 * The url an alias matches: the route's own segment with whichever parts the alias carries replaced.
 */
type AliasUrl<
  TOptions extends AddAliasOptions,
  TMatches extends CreatedRouteOptions[]
> = SegmentUrl<
  TMatches,
  AliasPart<TOptions, 'path', SegmentPath<TMatches>>,
  AliasPart<TOptions, 'query', SegmentQuery<TMatches>>,
  AliasPart<TOptions, 'hash', SegmentHash<TMatches>>
>

/**
 * The params an alias parses from a url, as read.
 */
type AliasParams<
  TOptions extends AddAliasOptions,
  TMatches extends CreatedRouteOptions[]
> = UrlParamsReading<AliasUrl<TOptions, TMatches>>

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
> = AliasParams<TOptions, TMatches> extends SegmentParams<TMatches>
  ? [transform?: AliasTransform<AliasParams<TOptions, TMatches>, SegmentParams<TMatches>>]
  : [transform: AliasTransform<AliasParams<TOptions, TMatches>, SegmentParams<TMatches>>]

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
   * The alias replaces whichever of this route's own `path`, `query`, and `hash` it carries and keeps the
   * rest. It composes with any aliases of the route's ancestors, and can declare its own params, typed the
   * same way a route's are.
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
