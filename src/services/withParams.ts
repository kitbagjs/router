import { getParamsForString } from '@/services/getParamsForString'
import { ExtractParamName, ExtractWithParamsParamType, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'
import { MakeOptional } from '@/utilities/makeOptional'

type AssignableParamsFromString<
  TValue extends string
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? Record<ExtractParamName<TParam>, Param | undefined> & AssignableParamsFromString<Rest>
  : {}

type ExtractParamsFromString<
  TValue extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? Record<TParam, ExtractWithParamsParamType<TParam, TParams>> & ExtractParamsFromString<Rest, TParams>
  : {}

export type WithParams<
  TValue extends string = string,
  TParams extends Record<string, Param | undefined> = Record<string, Param | undefined>
> = {
  value: TValue,
  params: string extends TValue ? Record<string, Param> : Identity<ExtractParamsFromString<TValue, TParams>>,
}

export type ToWithParams<T extends string | WithParams | undefined> = T extends string
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
  const TParams extends MakeOptional<AssignableParamsFromString<TValue>>
>(value: TValue, params: TParams): WithParams<TValue, TParams>
export function withParams(): WithParams<'', {}>
export function withParams(value?: string, params?: Record<string, Param | undefined>): WithParams {
  return {
    value: value ?? '',
    params: getParamsForString(value, params),
  }
}
