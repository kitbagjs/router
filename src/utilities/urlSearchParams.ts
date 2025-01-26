import { QuerySource } from '@/types/querySource'

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
