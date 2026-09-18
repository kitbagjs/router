import { Url } from '@/types/url'

/**
 * What an alias transform is given: the url that matched and the params the alias pattern parsed from it.
 *
 * @template TParams - The alias's own params, typed by the alias pattern.
 */
export type AliasTransformContext<TParams = Record<string, unknown>> = {
  /**
   * The url that matched the alias.
   */
  url: string,
  /**
   * The params the alias pattern parsed from the url, typed by the alias's own params rather than the
   * route's.
   */
  params: TParams,
}

/**
 * Maps what an alias matched into the params the route declares. Runs synchronously during matching. Any
 * param the route declares that the alias pattern does not carry must be supplied here.
 *
 * @template TParams - The alias's own params.
 * @template TRouteParams - The params of the route the alias belongs to.
 */
export type AliasTransform<
  TParams = Record<string, unknown>,
  TRouteParams = Record<string, unknown>
> = (context: AliasTransformContext<TParams>) => TRouteParams

/**
 * An alias combined with every ancestor into a single url the router can match, plus the transform that
 * maps everything that url parsed into the route's params. The transform is the composition of each
 * level's own transform, so it stays local to the segment each level aliased.
 */
export type RouteAlias = {
  url: Url,
  transform: (url: string, params: Record<string, unknown>) => Record<string, unknown>,
}
