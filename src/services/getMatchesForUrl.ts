import { createResolvedRoute } from '@/services/createResolvedRoute'
import { parseUrl } from '@/services/urlParser'
import { filterQueryParams } from '@/services/queryParamFilter'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { ParseUrlOptions } from '@/types/url'
import { isNamedRoute } from '@/utilities/isNamedRoute'

type MatchOptions = { state?: Partial<unknown> } & ParseUrlOptions

export function getMatchForUrl(routes: Routes, url: string, options: MatchOptions = {}): ResolvedRoute | undefined {
  const { query, hash } = parseUrl(url)

  for (const route of routes) {
    if (!isNamedRoute(route)) {
      continue
    }

    const { success, params } = route.tryParse(url, options)

    if (success) {
      const updatedUrl = route.stringify(params)
      const { query: updatedQuery } = parseUrl(updatedUrl)
      const queryWithoutParams = filterQueryParams(query, updatedQuery)

      return createResolvedRoute(route, params, { ...options, query: queryWithoutParams, hash })
    }
  }
}
