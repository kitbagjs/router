import { QuerySource } from '@/types/query'

export function combineUrlSearchParams(aParams: URLSearchParams | QuerySource, bParams: URLSearchParams | QuerySource): URLSearchParams {
  const combinedParams = new URLSearchParams(aParams)
  const paramsToAdd = new URLSearchParams(bParams)

  for (const [key, value] of paramsToAdd.entries()) {
    combinedParams.append(key, value)
  }

  return combinedParams
}
