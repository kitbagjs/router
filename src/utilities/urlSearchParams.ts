import { createUrl } from '@/services/urlCreator'
import { parseUrl } from '@/services/urlParser'
import { QuerySource } from '@/types/query'
import { Url } from '@/types/url'

export function combineUrlSearchParams(aParams: URLSearchParams | QuerySource, bParams: URLSearchParams | QuerySource): URLSearchParams {
  const combinedParams = new URLSearchParams(aParams)
  const paramsToAdd = new URLSearchParams(bParams)

  for (const [key, value] of paramsToAdd.entries()) {
    combinedParams.append(key, value)
  }

  return combinedParams
}

export function appendQuery(url: Url, query: QuerySource): Url {
  const { searchParams, ...parts } = parseUrl(url)

  return createUrl({ ...parts, searchParams: combineUrlSearchParams(searchParams, query) })
}
