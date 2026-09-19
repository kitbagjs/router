import { combineUrl } from '@/services/combineUrl'
import { createUrl } from '@/services/createUrl'
import { toUrlPart, toUrlQueryPart, UrlPart } from '@/services/withParams'
import { AddAliasOptions } from '@/types/addAlias'
import { AliasTransform, RouteAlias } from '@/types/routeAlias'
import { CreatedRouteOptions, isRoute, Route } from '@/types/route'
import { isUrl, Url } from '@/types/url'

/**
 * The loose runtime signature of the `addAlias` method. Purposely wide: it returns Route rather than the
 * refined chainable route `RouteAddAlias` describes.
 */
export type AddAlias = (options: AddAliasOptions, transform?: AliasTransform) => Route

/**
 * One level's own part of a url: its path, query, and hash, and the transform that maps what they parse
 * into the params they declare. A route's own segment has no transform; an alias segment might.
 */
type Segment = {
  path: UrlPart,
  query: UrlPart,
  hash: UrlPart,
  transform: AliasTransform | undefined,
}

/**
 * The aliases a nested route inherits: each of its parent's aliases combined with the route's own segment.
 * The parent's own url is left out, since combined with the route's own segment it is the route's own url,
 * not an alias.
 */
export function combineAliases(parent: Route, child: Route): RouteAlias[] {
  const match = child.matches.at(-1)

  if (!match || !isRoute(parent)) {
    return []
  }

  return combineSegment(parent.aliases, toSegment(match))
}

/**
 * The aliases an `addAlias` call adds: the alias segment combined with every url the parent can be reached
 * under, or standing alone when there is no parent to combine with.
 */
export function createAliases(match: CreatedRouteOptions, options: AddAliasOptions, transform: AliasTransform | undefined): RouteAlias[] {
  const parent = getUrlParent(match)
  const segment = toAliasSegment(options, transform)

  if (!parent) {
    return [
      {
        url: createUrl(segment),
        transform: toTransform(segment),
      },
    ]
  }

  return combineSegment(getRouteAliases(parent), segment)
}

function toSegment(match: CreatedRouteOptions): Segment {
  return {
    path: toUrlPart(match.path),
    query: toUrlQueryPart(match.query),
    hash: toUrlPart(match.hash),
    transform: undefined,
  }
}

/**
 * An alias declares its whole segment. Nothing is taken from the route's own, so a route param the alias
 * does not carry is the transform's to supply.
 */
function toAliasSegment(options: AddAliasOptions, transform: AliasTransform | undefined): Segment {
  return {
    path: toUrlPart(options.path),
    query: toUrlQueryPart(options.query),
    hash: toUrlPart(options.hash),
    transform,
  }
}

/**
 * The parent whose url a match combines with. A hoisted route keeps its parent's matches but not its url,
 * so nothing of the parent's is combined with it.
 */
function getUrlParent(match: CreatedRouteOptions): Route | undefined {
  if (match.hoist || !isRoute(match.parent)) {
    return undefined
  }

  return match.parent
}

/**
 * Combines a segment with each of the given aliases. The alias's transform maps the parent's part of the
 * params and the segment's maps its own, so each level only ever has to know about the params it declared.
 */
function combineSegment(aliases: RouteAlias[], segment: Segment): RouteAlias[] {
  const transform = toTransform(segment)

  return aliases.map((alias) => ({
    url: combineUrl(alias.url, segment),
    transform: (url, params) => ({
      ...alias.transform(url, params),
      ...transform(url, params),
    }),
  }))
}

/**
 * Every url a route matches, as aliases: its own url first, then its aliases. A child's alias has to be
 * combined with each of them, so the route's own url is given the same shape with a transform that passes
 * its params through by name. It is only ever used here, never matched as an alias.
 */
function getRouteAliases(route: Route): RouteAlias[] {
  const own: RouteAlias = {
    url: route,
    transform: pickParams(getUrlParamNames(route)),
  }
  const aliases = isRoute(route) ? route.aliases : []

  return [own, ...aliases]
}

function toTransform(segment: Segment): RouteAlias['transform'] {
  const parts = [segment.path, segment.query, segment.hash]
  const names = parts.flatMap((part) => Object.keys(part.params))
  const pick = pickParams(names)
  const { transform } = segment

  if (!transform) {
    return pick
  }

  return (url, params) => transform({ url, params: pick(url, params) })
}

function getUrlParamNames(url: Url): string[] {
  if (!isUrl(url)) {
    return []
  }

  const parts = Object.values(url.schema)

  return parts.flatMap((part) => Object.keys(part.params))
}

/**
 * A transform that passes through only the named params, which is what a segment without a transform
 * of its own contributes.
 */
function pickParams(names: string[]): RouteAlias['transform'] {
  return (_url, params) => {
    const picked: Record<string, unknown> = {}

    for (const name of names) {
      if (name in params) {
        picked[name] = params[name]
      }
    }

    return picked
  }
}
