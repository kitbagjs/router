import { combineUrl } from '@/services/combineUrl'
import { createUrl } from '@/services/createUrl'
import { isUrlPart, toUrlPart, toUrlQueryPart, UrlPart } from '@/services/withParams'
import { AddAliasOptions, AliasPattern } from '@/types/addAlias'
import { AliasTransform, RouteAlias } from '@/types/routeAlias'
import { CreatedRouteOptions, isRoute, Route } from '@/types/route'
import { isUrl, Url } from '@/types/url'

/**
 * The loose runtime signature of the `addAlias` method. Purposely wide: it returns Route rather than the
 * refined chainable route `RouteAddAlias` describes.
 */
export type AddAlias = (pattern: AliasPattern, transform?: AliasTransform) => Route

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
 * The segment an alias pattern describes. A string or url part replaces the route's own path; an options
 * object replaces whichever of path, query, and hash it carries. Anything not replaced is the route's own.
 */
export function toSegment(match: CreatedRouteOptions, pattern: AliasPattern = {}, transform?: AliasTransform): Segment {
  const options = toAliasOptions(pattern)

  return {
    path: toUrlPart(options.path ?? match.path),
    query: toUrlQueryPart(options.query ?? match.query),
    hash: toUrlPart(options.hash ?? match.hash),
    transform,
  }
}

function toAliasOptions(pattern: AliasPattern): AddAliasOptions {
  if (typeof pattern === 'string' || isUrlPart(pattern)) {
    return { path: pattern }
  }

  return pattern
}

/**
 * The parent whose url a match combines with. A hoisted route keeps its parent's matches but not its url,
 * so nothing of the parent's is combined with it.
 */
export function getUrlParent(match: CreatedRouteOptions): Route | undefined {
  if (match.hoist || !isRoute(match.parent)) {
    return undefined
  }

  return match.parent
}

/**
 * Combines a segment with each url of the parent, or stands it alone when there is no parent to combine
 * with. The parent's transform maps the parent's part of the params and the segment's maps its own, so
 * each level only ever has to know about the params it declared.
 */
export function combineSegment(parent: Route | undefined, segment: Segment): RouteAlias[] {
  const transform = toTransform(segment)

  if (!parent) {
    return [{ url: createUrl(segment), transform }]
  }

  return getUrlSpace(parent).map((parentUrl) => ({
    url: combineUrl(parentUrl.url, segment),
    transform: (url, params) => ({
      ...parentUrl.transform(url, params),
      ...transform(url, params),
    }),
  }))
}

/**
 * Every url a route matches, its own first. Each carries the transform that maps what the url parses into
 * the route's params, which for the route's own url is the params themselves.
 */
function getUrlSpace(route: Route): RouteAlias[] {
  return [
    { url: route, transform: pickParams(getUrlParamNames(route)) },
    ...isRoute(route) ? route.aliases : [],
  ]
}

function toTransform({ path, query, hash, transform }: Segment): RouteAlias['transform'] {
  const pick = pickParams([path, query, hash].flatMap((part) => Object.keys(part.params)))

  if (!transform) {
    return pick
  }

  return (url, params) => transform({ url, params: pick(url, params) })
}

function getUrlParamNames(url: Url): string[] {
  if (!isUrl(url)) {
    return []
  }

  return Object.values(url.schema).flatMap((part) => Object.keys(part.params))
}

function pickParams(names: string[]): RouteAlias['transform'] {
  return (_url, params) => Object.fromEntries(names.filter((name) => name in params).map((name) => [name, params[name]]))
}
