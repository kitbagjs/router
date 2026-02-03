import { createResolvedRoute } from '@/services/createResolvedRoute'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterResolveOptions } from '@/types/routerResolve'
import { isNamedRoute } from '@/utilities/isNamedRoute'

export function getMatchForUrl(routes: Routes, url: string, options: RouterResolveOptions = {}): ResolvedRoute | undefined {
  const { query, hash } = parseUrl(updateUrl(url, options))

  for (const route of routes) {
    if (!isNamedRoute(route)) {
      continue
    }

    const { success, params } = route.tryParse(url)

    if (success) {
      return createResolvedRoute(route, params, { ...options, query, hash })
    }
  }
}
