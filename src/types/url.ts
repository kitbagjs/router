/* eslint-disable @typescript-eslint/method-signature-style */
import { ToWithParams, WithParams } from '@/services/withParams'
import { ExtractParamType, ParamStart, ParamEnd } from '@/types/params'
import { AllPropertiesAreOptional, Identity } from '@/types/utilities'
import { UrlString } from '@/types/urlString'
import { Param, ParamGetSet } from './paramTypes'
import { MakeOptional } from '@/utilities/makeOptional'

export type CreateUrlOptions = {
  host?: string | WithParams | undefined,
  path?: string | WithParams | undefined,
  query?: string | WithParams | undefined,
  hash?: string | WithParams | undefined,
}

export type ToUrl<
  TOptions extends CreateUrlOptions
> = Url<
  & ToUrlParams<ToWithParams<TOptions['host']>>
  & ToUrlParams<ToWithParams<TOptions['path']>>
  & ToUrlParams<ToWithParams<TOptions['query']>>
  & ToUrlParams<ToWithParams<TOptions['hash']>>
>

type UrlParams = Record<string, [param: Param, isOptional: boolean]>

type ToUrlParams<TWithParams extends WithParams> = {
  [K in keyof TWithParams['params']]: TWithParams['value'] extends `${string}${ParamStart}?${K & string}${ParamEnd}${string}`
    ? [TWithParams['params'][K], true]
    : [TWithParams['params'][K], false]
}

/**
 * Represents the structure of a url parts. Can be used to create a url with support for params.
 */
export type Url<TParams extends UrlParams = UrlParams> = {
  /**
   * @internal
   * The underlying value of the url.
   */
  _schema: Record<string, WithParams>,
  /**
   * @internal
   * The parameters type for the url.
   */
  _params: TParams,
  /**
   * Converts the url parts to a full url.
   */
  stringify(...params: UrlParamsArgs<TParams>): UrlString,
  /**
   * Parses the url supplied and returns any params found.
   */
  parse(url: string): ToUrlParamsReading<TParams>,
  /**
   * Checks if the supplied url matches this url. Any value above 0 is a match. Can be used to compare to other partial matches. Max score is 100.
   */
  match(url: string): number,
}

type UrlParamsArgs<
  TParams extends UrlParams
> = AllPropertiesAreOptional<ToUrlParamsWriting<TParams>> extends true
  ? [params?: ToUrlParamsWriting<TParams>]
  : [params: ToUrlParamsWriting<TParams>]

/**
* Extracts combined types of path and query parameters for a given url, creating a unified parameter object.
* @template TUrl - The url type from which to extract and merge parameter types.
* @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
*/
export type UrlParamsReading<TUrl extends Url> = ToUrlParamsReading<TUrl['_params']>

type ToUrlParamsReading<
  TParams extends UrlParams
> =
Identity<
  MakeOptional<{
    [K in keyof TParams]: TParams[K] extends [infer TParam extends Param, true]
      ? TParam extends Required<ParamGetSet>
        ? ExtractParamType<TParam>
        : ExtractParamType<TParam> | undefined
      : TParams[K] extends [infer TParam extends Param, false]
        ? ExtractParamType<TParam>
        : never
  }>
>

/**
* Extracts combined types of path and query parameters for a given url, creating a unified parameter object.
* Differs from ExtractRouteParamTypesReading in that optional params with defaults will remain optional.
* @template TUrl - The url type from which to extract and merge parameter types.
* @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
*/
export type UrlParamsWriting<TUrl extends Url> = ToUrlParamsWriting<TUrl['_params']>

type ToUrlParamsWriting<
  TParams extends UrlParams
> =
Identity<
  MakeOptional<{
    [K in keyof TParams]: TParams[K] extends [infer TParam extends Param, true]
      ? ExtractParamType<TParam> | undefined
      : TParams[K] extends [infer TParam extends Param, false]
        ? ExtractParamType<TParam>
        : never
  }>
>
