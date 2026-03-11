import { QuerySource } from '@/types/querySource'

export function filterQueryParams(source: QuerySource, exclude: QuerySource): URLSearchParams {
  const sourceParams = new URLSearchParams(source)
  const excludeParams = new URLSearchParams(exclude)

  for (const [key, value] of sourceParams.entries()) {
    if (excludeParams.has(key) && excludeParams.get(key) === value) {
      sourceParams.delete(key)
    }
  }

  return sourceParams
}
