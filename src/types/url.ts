/* eslint-disable @typescript-eslint/method-signature-style */
import { ToWithParams, WithParams } from '@/services/withParams'
import { ExtractParamType, IsOptionalParamTemplate } from '@/types/params'
import { AllPropertiesAreOptional, Identity } from '@/types/utilities'
import { UrlString } from '@/types/urlString'
import { Param } from './paramTypes'
import { MakeOptional } from '@/utilities/makeOptional'
import { ParamWithDefault } from '@/services/withDefault'

export const IS_URL_SYMBOL = Symbol('IS_URL_SYMBOL')

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

type OptionalParam<TParam extends Param = Param> = [param: TParam, isOptional: true]
type RequiredParam<TParam extends Param = Param> = [param: TParam, isOptional: false]
type UrlParams = Record<string, OptionalParam | RequiredParam>

type ToUrlParams<TWithParams extends WithParams> = {
  [K in keyof TWithParams['params']]: [TWithParams['params'][K], IsOptionalParamTemplate<K & string, TWithParams['value']>]
}

/**
 * Type guard to assert that a url has a schema.
 * @internal
 */
export function isUrlWithSchema(url: unknown): url is Url & { schema: Record<string, WithParams> } {
  return typeof url === 'object' && url !== null && IS_URL_SYMBOL in url
}

/**
 * Represents the structure of a url parts. Can be used to create a url with support for params.
 */
export type Url<TParams extends UrlParams = UrlParams> = {
  /**
   * @internal
   * The parameters type for the url.
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
  tryParse(url: string): { success: true, params: ToUrlParamsReading<TParams> } | { success: false, error: Error },
  /**
   * @internal
   * Checks if the supplied url matches this url. Any value above 0 is a match. Can be used to compare to other partial matches. Max score is 100.
   */
  match(url: string): { score: number, params: ToUrlParamsReading<TParams> },
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
    [K in keyof TParams]: TParams[K] extends OptionalParam<infer TParam>
      ? TParam extends ParamWithDefault
        ? ExtractParamType<TParam>
        : ExtractParamType<TParam> | undefined
      : TParams[K] extends RequiredParam<infer TParam>
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
export type UrlParamsWriting<TUrl extends Url> = ToUrlParamsWriting<TUrl['params']>

type ToUrlParamsWriting<
  TParams extends UrlParams
> =
Identity<
  MakeOptional<{
    [K in keyof TParams]: TParams[K] extends OptionalParam<infer TParam>
      ? ExtractParamType<TParam> | undefined
      : TParams[K] extends RequiredParam<infer TParam>
        ? ExtractParamType<TParam>
        : never
  }>
>
