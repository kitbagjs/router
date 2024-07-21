import { host } from '@/services/host'
import { ExtractParamName, ExtractPathParamType, MergeParams, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'

type ExtractParamsFromHostString<
  THost extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = THost extends `${string}${ParamStart}${infer Param}${ParamEnd}${infer Rest}`
  ? MergeParams<{ [P in Param]: ExtractPathParamType<Param, TParams> }, ExtractParamsFromHostString<Rest, TParams>>
  : Record<never, never>

export type HostParams<THost extends string> = {
  [K in keyof ExtractParamsFromHostString<THost>]?: Param
}

export type HostParamsWithParamNameExtracted<THost extends string> = {
  [K in keyof ExtractParamsFromHostString<THost> as ExtractParamName<K>]?: Param
}

export type Host<
  THost extends string = string,
  TParams extends HostParamsWithParamNameExtracted<THost> = Record<string, Param | undefined>
> = {
  host: THost,
  params: string extends THost ? Record<string, Param> : Identity<ExtractParamsFromHostString<THost, TParams>>,
  toString: () => string,
}

export type ToHost<T extends string | Host> = T extends string ? Host<T, {}> : T

function isHost(value: unknown): value is Host {
  return isRecord(value) && typeof value.host === 'string'
}

export function toHost<T extends string | Host>(value: T): ToHost<T>
export function toHost<T extends string | Host>(value: T): Host {
  if (isHost(value)) {
    return value
  }

  return host(value, {})
}