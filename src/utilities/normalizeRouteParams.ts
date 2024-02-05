import { asArray } from '@/utilities/array'

export function normalizeRouteParams(params: Record<string, unknown>): Record<string, unknown[]> {
  const normalizedParams: Record<string, unknown[]> = {}
  const keys = Object.keys(params)

  for (const key of keys) {
    const value = params[key]

    normalizedParams[key] = asArray(value)
  }

  return normalizedParams
}