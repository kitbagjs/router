/* eslint-disable @typescript-eslint/method-signature-style */
import { WithParams } from '@/services/withParams'
import { ExtractUrlParamTypesReading, ExtractUrlParamTypesWriting } from '@/types/params'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { UrlString } from '@/types/urlString'

/**
 * Represents the structure of a url parts. Can be used to create a url with support for params.
 */
export type Url<
  THost extends WithParams = WithParams,
  TPath extends WithParams = WithParams,
  TQuery extends WithParams = WithParams,
  THash extends WithParams = WithParams
> = {
  /**
   * Represents the host for this route. Used for external routes.
  */
  host: THost & {
    toString(...params: UrlParamsArgs<{ host: THost }>): string,
  },
  /**
   * Represents the structured path of the route, including path params.
  */
  path: TPath & {
    toString(...params: UrlParamsArgs<{ path: TPath }>): string,
  },
  /**
   * Represents the structured query of the route, including query params.
  */
  query: TQuery & {
    toString(...params: UrlParamsArgs<{ query: TQuery }>): string,
  },
  /**
   * Represents the hash of the route.
   */
  hash: THash & {
    toString(...params: UrlParamsArgs<{ hash: THash }>): string,
  },
  /**
   * Converts the url parts to a full url.
   */
  toString(...params: UrlParamsArgs<{ host: THost, path: TPath, query: TQuery, hash: THash }>): UrlString,
  /**
   * Parses the url supplied and returns any params found.
   */
  parse(url: string): ExtractUrlParamTypesReading<{ host: THost, path: TPath, query: TQuery, hash: THash }>,
}

type UrlParamsArgs<
  TUrl extends {
    host?: WithParams,
    path?: WithParams,
    query?: WithParams,
    hash?: WithParams,
  }
> = AllPropertiesAreOptional<ExtractUrlParamTypesWriting<TUrl>> extends true
  ? [params?: ExtractUrlParamTypesWriting<TUrl>]
  : [params: ExtractUrlParamTypesWriting<TUrl>]
