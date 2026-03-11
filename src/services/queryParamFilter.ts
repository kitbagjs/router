import { QuerySource } from '@/types/querySource'

export function filterQueryParams(source: QuerySource, exclude: QuerySource): URLSearchParams {
  const sourceParams = new URLSearchParams(source)
  const excludeParams = new URLSearchParams(exclude)

  for (const [key, value] of excludeParams.entries()) {
    sourceParams.delete(key, value)
  }

  return sourceParams
}
