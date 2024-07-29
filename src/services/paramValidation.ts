import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { getParamValue } from '@/services/params'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Param } from '@/types/paramTypes'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParamValues(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParamValues = (route: Route, url: string): Record<string, unknown> => {
  const { pathname, search } = createMaybeRelativeUrl(url)

  return {
    ...getPathParams(route.path, pathname),
    ...getQueryParams(route.query, search),
  }
}

export const getRouteStateParamValues = (params: Record<string, Param>, state: unknown): Record<string, unknown> => {
  const values: Record<string, unknown> = {}

  for (const [key, param] of Object.entries(params)) {
    const isOptional = true
    const value = getStateValue(state, key)
    const paramValue = getParamValue(value, param, isOptional)

    values[key] = paramValue
  }

  return values
}

function getPathParams(path: Path, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const decodedValueFromUrl = decodeURIComponent(url)

  for (const [key, param] of Object.entries(path.params)) {
    const isOptional = key.startsWith('?')
    const paramName = isOptional ? key.slice(1) : key
    const stringValue = getParamValueFromUrl(decodedValueFromUrl, path.toString(), key)
    const paramValue = getParamValue(stringValue, param, isOptional)

    values[paramName] = paramValue
  }

  return values
}

function getQueryParams(query: Query, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const actualSearch = new URLSearchParams(url)

  for (const [key, param] of Object.entries(query.params)) {
    const isOptional = key.startsWith('?')
    const paramName = isOptional ? key.slice(1) : key
    const valueOnUrl = actualSearch.get(paramName) ?? undefined
    const paramValue = getParamValue(valueOnUrl, param, isOptional)

    values[paramName] = paramValue
  }

  return values
}

function stateIsRecord(state: unknown): state is Record<string, unknown> {
  return !!state && typeof state === 'object'
}

function getStateValue(state: unknown, key: string): string | undefined {
  if (stateIsRecord(state) && key in state) {
    const value = state[key]

    if (typeof value === 'string') {
      return value
    }
  }

  return undefined
}