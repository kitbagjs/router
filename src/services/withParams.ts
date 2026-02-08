import { getParamsForString } from '@/services/getParamsForString'
import { ExtractParamName, ParamEnd, ParamIsGreedy, ParamIsOptional, ParamStart } from '@/types/params'
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
    ? TParams[ExtractParamName<TParam>] extends Param
      ? Record<ExtractParamName<TParam>, Identity<{ param: TParams[ExtractParamName<TParam>] } & ExtractParamOptions<TParam>>> & WithParamsParamsOutput<Rest, TParams>
      : Record<ExtractParamName<TParam>, Identity<{ param: StringConstructor } & ExtractParamOptions<TParam>>> & WithParamsParamsOutput<Rest, TParams>
    : Record<ExtractParamName<TParam>, Identity<{ param: StringConstructor } & ExtractParamOptions<TParam>>> & WithParamsParamsOutput<Rest, TParams>
  : {}

type ExtractParamOptions<TParam extends string> = {
  isOptional: ParamIsOptional<TParam>,
  isGreedy: ParamIsGreedy<TParam>,
}

const UrlPartsWithParamsSymbol = Symbol('UrlPartsWithParams')

export type UrlParam<TParam extends Param = Param> = { param: TParam, isOptional: boolean, isGreedy: boolean }
export type UrlParams = Record<string, UrlParam>

export type UrlPart<TParams extends UrlParams = UrlParams> = {
  value: string,
  params: Identity<TParams>,
  [UrlPartsWithParamsSymbol]: true,
}

export type ToUrlPart<T extends string | UrlPart | undefined> = T extends string
  ? UrlPart<WithParamsParamsOutput<T>>
  : T extends undefined
    ? UrlPart<{}>
    : unknown extends T
      ? UrlPart<{}>
      : T

function isUrlPartsWithParams(maybeUrlPartsWithParams: unknown): maybeUrlPartsWithParams is UrlPart {
  return isRecord(maybeUrlPartsWithParams) && maybeUrlPartsWithParams[UrlPartsWithParamsSymbol] === true
}

export function toUrlPart<T extends string | UrlPart | undefined>(value: T): ToUrlPart<T>
export function toUrlPart<T extends string | UrlPart | undefined>(value: T): UrlPart {
  if (value === undefined) {
    return withParams()
  }

  if (isUrlPartsWithParams(value)) {
    return value
  }

  return withParams(value, {})
}

export function withParams<
  const TValue extends string,
  const TParams extends MakeOptional<WithParamsParamsInput<TValue>>
>(value: TValue, params: TParams): WithParamsParamsOutput<TValue, TParams> extends UrlParams ? UrlPart<WithParamsParamsOutput<TValue, TParams>> : never
export function withParams(): UrlPart<{}>
export function withParams(value?: string, params?: Record<string, Param | undefined>): UrlPart {
  return {
    value: value ?? '',
    params: getParamsForString(value, params),
    [UrlPartsWithParamsSymbol]: true,
  }
}
