import { host as createHost } from '@/services/host'
import { ExtractParamName, ExtractPathParamType, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'

type ExtractParamsFromHostString<
  THost extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = THost extends `${string}${ParamStart}${infer Param}${ParamEnd}${infer Rest}`
  ? Record<Param, ExtractPathParamType<Param, TParams>> & ExtractParamsFromHostString<Rest, TParams>
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
  value: THost,
  params: string extends THost ? Record<string, Param> : Identity<ExtractParamsFromHostString<THost, TParams>>,
}

export type ToHost<T extends string | Host | undefined> = T extends string
  ? Host<T, {}>
  : T extends undefined
    ? Host<'', {}>
    : unknown extends T
      ? Host<'', {}>
      : T

function isHost(maybeHost: unknown): maybeHost is Host {
  return isRecord(maybeHost) && typeof maybeHost.value === 'string'
}

export function toHost<T extends string | Host>(host: T): ToHost<T>
export function toHost<T extends string | Host>(host: T): Host {
  if (isHost(host)) {
    return host
  }

  return createHost(host, {})
}
