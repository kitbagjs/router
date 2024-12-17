import { createUrl } from '@/services/urlCreator'
import { parseUrl } from '@/services/urlParser'
import { QuerySource } from '@/types/query'
import { Url } from '@/types/url'

export function combineUrlSearchParams(...paramGroups: (URLSearchParams | QuerySource)[]): URLSearchParams {
  const combinedParams = new URLSearchParams()

  for (const params of paramGroups) {
    const paramsToAdd = new URLSearchParams(params)

    for (const [key, value] of paramsToAdd.entries()) {
      combinedParams.append(key, value)
    }
  }

  return combinedParams
}

export function appendQuery(url: Url, query: QuerySource): Url {
  const { searchParams, ...parts } = parseUrl(url)

  return createUrl({ ...parts, searchParams: combineUrlSearchParams(searchParams, query) })
}
