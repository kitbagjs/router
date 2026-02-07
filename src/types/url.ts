/* eslint-disable @typescript-eslint/method-signature-style */
import { ToUrlPart, UrlParams, UrlPart } from '@/services/withParams'
import { ExtractParamType } from '@/types/params'
import { AllPropertiesAreOptional, Identity } from '@/types/utilities'
import { UrlString } from '@/types/urlString'
import { Param, ParamGetSet } from '@/types/paramTypes'
import { MakeOptional } from '@/utilities/makeOptional'

export const IS_URL_SYMBOL = Symbol('IS_URL_SYMBOL')

export type CreateUrlOptions = {
  host?: string | UrlPart | undefined,
  path?: string | UrlPart | undefined,
  query?: string | UrlPart | undefined,
  hash?: string | UrlPart | undefined,
}

export type ToUrl<
  TOptions extends CreateUrlOptions
> = Url<Identity<
  & ToUrlPart<TOptions['host']>['params']
  & ToUrlPart<TOptions['path']>['params']
  & ToUrlPart<TOptions['query']>['params']
  & ToUrlPart<TOptions['hash']>['params']
>>

/**
 * Type guard to assert that a url has a schema.
 * @internal
 */
export function isUrlWithSchema(url: unknown): url is Url & { schema: Record<string, UrlPart> } {
  return typeof url === 'object' && url !== null && IS_URL_SYMBOL in url
}

/**
 * Represents the structure of a url parts. Can be used to create a url with support for params.
 */
export type Url<TParams extends UrlParams = UrlParams> = {
  /**
   * @internal
   * The parameters type for the url. Non functional and undefined at runtime.
   */
  params: TParams,
  /**
   * Converts the url parts to a full url.
   */
  stringify(...params: UrlParamsArgs<TParams>): UrlString,
  /**
   * Parses the url supplied and returns any params found.
   */
  parse(url: string): ToUrlParamsReading<TParams>,
  /**
   * Parses the url supplied and returns any params found.
   */
  tryParse(url: string): { success: true, params: ToUrlParamsReading<TParams> } | { success: false, params: {}, error: Error },
  /**
   * True if the url is relative. False if the url is absolute.
   */
  isRelative: boolean,
  /**
   * @internal
   * Symbol to identify if the url is a valid url.
   */
  [IS_URL_SYMBOL]: true,
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
export type UrlParamsReading<TUrl extends Url> = ToUrlParamsReading<TUrl['params']>

type ToUrlParamsReading<
  TParams extends UrlParams
> =
Identity<
  MakeOptional<{
    [K in keyof TParams]: TParams[K] extends [infer TParam extends Param, { isOptional: true }]
      ? TParam extends Required<ParamGetSet>
        ? ExtractParamType<TParam>
        : ExtractParamType<TParam> | undefined
      : TParams[K] extends [infer TParam extends Param, { isOptional: false }]
        ? ExtractParamType<TParam>
        : unknown
  }>
>

/**
* Extracts combined types of path and query parameters for a given url, creating a unified parameter object.
* Differs from ExtractRouteParamTypesReading in that optional params with defaults will remain optional.
* @template TUrl - The url type from which to extract and merge parameter types.
* @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
*/
export type UrlParamsWriting<TUrl extends Url> = ToUrlParamsWriting<TUrl['params']>

type ToUrlParamsWriting<
  TParams extends UrlParams
> =
Identity<
  MakeOptional<{
    [K in keyof TParams]: TParams[K] extends [infer TParam extends Param, { isOptional: true }]
      ? ExtractParamType<TParam> | undefined
      : TParams[K] extends [infer TParam extends Param, { isOptional: false }]
        ? ExtractParamType<TParam>
        : unknown
  }>
>
