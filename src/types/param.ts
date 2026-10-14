import { ParamGetter, ParamSetter } from '@/types/paramTypes'

export const IS_PARAM_SYMBOL = Symbol('IS_PARAM_SYMBOL')

export type ParamInternal = {
  [IS_PARAM_SYMBOL]: true,
}

/**
 * A param definition that parses and stringifies values.
 */
export type Param<T = unknown> = {
  get: ParamGetter<T>,
  set: ParamSetter<T>,
  defaultValue?: T,
}

/**
 * Determines whether a value is a param definition.
 */
export function isParam(value: unknown): value is Param & ParamInternal {
  return typeof value === 'object' && value !== null && IS_PARAM_SYMBOL in value
}
