import { getParamValue, setParamValue } from '@/services/params'
import { Param } from '@/types/paramTypes'

function stateIsRecord(state: unknown): state is Record<string, unknown> {
  return !!state && typeof state === 'object'
}

const paramOptions = { isOptional: true, isGreedy: false }

function getStateValue(state: unknown, key: string, param: Param): unknown {
  if (stateIsRecord(state) && key in state) {
    const value = state[key]

    if (typeof value === 'string') {
      return getParamValue(value, { param, ...paramOptions })
    }

    return value
  }

  return getParamValue(undefined, { param, ...paramOptions })
}

/**
 * This function is used to get the values inside the state converted from string values into the correct type.
 */
export function getStateValues(params: Record<string, Param>, state: unknown): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const [key, param] of Object.entries(params)) {
    const paramValue = getStateValue(state, key, param)

    values[key] = paramValue
  }

  return values
}

/**
 * This function is used to get the values inside the state converted from string values into the correct type.
 */
function setStateValue(state: unknown, key: string, param: Param): string | undefined {
  if (stateIsRecord(state) && key in state) {
    const value = state[key]

    return setParamValue(value, { param, ...paramOptions })
  }

  return setParamValue(undefined, { param, ...paramOptions })
}

/**
 * This function is used to set the values inside the state to have string values, stored in history.
 */
export const setStateValues = (params: Record<string, Param>, state: unknown): Record<string, string | undefined> => {
  const values: Record<string, string | undefined> = {}

  for (const [key, param] of Object.entries(params)) {
    const paramValue = setStateValue(state, key, param)

    values[key] = paramValue
  }

  return values
}
