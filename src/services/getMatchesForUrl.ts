import { createResolvedRoute } from '@/services/createResolvedRoute'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ParseUrlOptions } from '@/types/url'
import { isNamedRoute } from '@/utilities/isNamedRoute'

type MatchOptions = {
  url: string,
  parseOptions?: ParseUrlOptions,
  resolveOptions?: RouterResolveOptions,
}

export function getMatchForUrl(routes: Routes, { url, parseOptions = {}, resolveOptions = {} }: MatchOptions): ResolvedRoute | undefined {
  const { query, hash } = parseUrl(updateUrl(url, resolveOptions))

  for (const route of routes) {
    if (!isNamedRoute(route)) {
      continue
    }

    const { success, params } = route.tryParse(url, parseOptions)

    if (success) {
      return createResolvedRoute(route, params, { ...resolveOptions, query, hash })
    }
  }
}
