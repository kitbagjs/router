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

type MatchWithState = { state?: Record<string, Param> }

/**
 * Serializes state values per match for storage in history. Each match's state
 * keys are serialized using that match's param definitions.
 */
export function setMatchStates(matches: MatchWithState[], state: unknown): Record<string, string | undefined>[] {
  return matches.map((match) => {
    const params = match.state ?? {}
    return setStateValues(params, state)
  })
}

/**
 * Deserializes per-match state values. Accepts either:
 * - An array of per-match state records (from history)
 * - A flat state object (from user-provided values, distributed to each match)
 */
export function getMatchStates(matches: MatchWithState[], state: unknown): Record<string, unknown>[] {
  if (Array.isArray(state)) {
    return matches.map((match, index) => {
      const params = match.state ?? {}
      return getStateValues(params, state[index])
    })
  }

  return matches.map((match) => {
    const params = match.state ?? {}
    return getStateValues(params, state)
  })
}

/**
 * Merges per-match state values into a single flat object. Later matches override
 * earlier ones (child shadows parent). Optionally stops at a given match index.
 */
export function resolveMatchStates(matchStates: Record<string, unknown>[], upToIndex?: number): Record<string, unknown> {
  const end = upToIndex !== undefined ? upToIndex + 1 : matchStates.length
  const result: Record<string, unknown> = {}

  for (let i = 0; i < end; i++) {
    Object.assign(result, matchStates[i])
  }

  return result
}
