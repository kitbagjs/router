import { createResolvedRoute } from '@/services/createResolvedRoute'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ParseUrlOptions } from '@/types/url'
import { isNamedRoute } from '@/utilities/isNamedRoute'

type MatchOptions = RouterResolveOptions & ParseUrlOptions

export function getMatchForUrl(routes: Routes, url: string, options: MatchOptions = {}): ResolvedRoute | undefined {
  const { query, hash } = parseUrl(updateUrl(url, options))

  for (const route of routes) {
    if (!isNamedRoute(route)) {
      continue
    }

    const { success, params } = route.tryParse(url, options)

    if (success) {
      return createResolvedRoute(route, params, { ...options, query, hash })
    }
  }
}
