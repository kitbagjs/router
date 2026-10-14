import { ParamGetter, ParamSetter } from '@/types/paramTypes'

export const PARAM_ID_SYMBOL = Symbol('PARAM_ID_SYMBOL')

export type ParamIdentity = {
  [PARAM_ID_SYMBOL]: symbol,
}

/**
 * A param definition with an identity that can be looked up independently of its URL name.
 */
export type Param<T = unknown> = {
  get: ParamGetter<T>,
  set: ParamSetter<T>,
  defaultValue?: T,
} & ParamIdentity

/**
 * Determines whether a value is a param definition with an identity.
 */
export function isParam(value: unknown): value is Param {
  return typeof value === 'object' && value !== null && PARAM_ID_SYMBOL in value
}
