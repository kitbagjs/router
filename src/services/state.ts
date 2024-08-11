import { getParamValue, setParamValue } from '@/services/params'
import { Param } from '@/types/paramTypes'

export function stateIsRecord(state: unknown): state is Record<string, unknown> {
  return !!state && typeof state === 'object'
}

const isOptional = true

export function getStateValue(state: unknown, key: string, param: Param): unknown {
  if (stateIsRecord(state) && key in state) {
    const value = state[key]

    if (typeof value === 'string') {
      return getParamValue(value, param, isOptional)
    }
  }

  return getParamValue(undefined, param, isOptional)
}

export function getStateValues(params: Record<string, Param>, state: unknown): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const [key, param] of Object.entries(params)) {
    const paramValue = getStateValue(state, key, param)

    values[key] = paramValue
  }

  return values
}

export function setStateValue(state: unknown, key: string, param: Param): string | undefined {
  if (stateIsRecord(state) && key in state) {
    const value = state[key]

    return setParamValue(value, param, isOptional)
  }

  return setParamValue(undefined, param, isOptional)
}

export const setStateValues = (params: Record<string, Param>, state: unknown): Record<string, string | undefined> => {
  const values: Record<string, string | undefined> = {}

  for (const [key, param] of Object.entries(params)) {
    const paramValue = setStateValue(state, key, param)

    values[key] = paramValue
  }

  return values
}