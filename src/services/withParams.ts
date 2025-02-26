import { getParamsForString } from '@/services/getParamsForString'
import { ExtractParamName, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'
import { MakeOptional } from '@/utilities/makeOptional'

type WithParamsParamsInput<
  TValue extends string
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? Record<ExtractParamName<TParam>, Param | undefined> & WithParamsParamsInput<Rest>
  : {}

type WithParamsParamsOutput<
  TValue extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? ExtractParamName<TParam> extends keyof TParams
    ? Record<ExtractParamName<TParam>, TParams[ExtractParamName<TParam>]> & WithParamsParamsOutput<Rest, TParams>
    : Record<ExtractParamName<TParam>, StringConstructor> & WithParamsParamsOutput<Rest, TParams>
  : {}

export type WithParams<
  TValue extends string = string,
  TParams extends Record<string, Param | undefined> = Record<string, Param | undefined>
> = {
  value: TValue,
  params: string extends TValue ? Record<string, Param> : Identity<WithParamsParamsOutput<TValue, TParams>>,
}

export type ToWithParams<T> = T extends string
  ? WithParams<T, {}>
  : T extends undefined
    ? WithParams<'', {}>
    : unknown extends T
      ? WithParams<'', {}>
      : T

function isWithParams(maybeWithParams: unknown): maybeWithParams is WithParams {
  return isRecord(maybeWithParams) && typeof maybeWithParams.value === 'string'
}

export function toWithParams<T extends string | WithParams | undefined>(value: T): ToWithParams<T>
export function toWithParams<T extends string | WithParams | undefined>(value: T): WithParams {
  if (value === undefined) {
    return withParams()
  }

  if (isWithParams(value)) {
    return value
  }

  return withParams(value, {})
}

export function withParams<
  const TValue extends string,
  const TParams extends MakeOptional<WithParamsParamsInput<TValue>>
>(value: TValue, params: TParams): WithParams<TValue, TParams>
export function withParams(): WithParams<'', {}>
export function withParams(value?: string, params?: Record<string, Param | undefined>): WithParams {
  return {
    value: value ?? '',
    params: getParamsForString(value, params),
  }
}
