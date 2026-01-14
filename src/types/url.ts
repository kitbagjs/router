import { WithParams } from '@/services/withParams'
import { ExtractRecordParamTypesReading, ExtractRecordParamTypesWriting } from '@/types/params'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/querySource'
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
  host: {
    schema: THost,
    toString: (...params: UrlParamsArgs<{ host: THost }>) => string,
  },
  /**
   * Represents the structured path of the route, including path params.
  */
  path: {
    schema: TPath,
    toString: (...params: UrlParamsArgs<{ path: TPath }>) => string,
  },
  /**
   * Represents the structured query of the route, including query params.
  */
  query: {
    schema: TQuery,
    toString: (...params: UrlParamsArgs<{ query: TQuery }>) => string,
  },
  /**
   * Represents the hash of the route.
   */
  hash: {
    schema: THash,
    toString: (...params: UrlParamsArgs<{ hash: THash }>) => string,
  },
  /**
   * Converts the url parts to a full url.
   */
  toString: (...params: UrlParamsArgs<{ host: THost, path: TPath, query: TQuery, hash: THash }>) => UrlString,
  /**
   * Parses the url supplied and returns any params found.
   */
  parse: (url: string) => ExtractRecordParamTypesReading<{ host: THost, path: TPath, query: TQuery, hash: THash }>,
}

export type ToStringOptions = {
  query?: QuerySource,
  hash?: string,
}

type UrlParamsArgs<
  TParts extends Record<string, unknown> = Record<string, unknown>
> = ExtractRecordParamTypesWriting<TParts> extends Record<string, unknown>
  ? [params?: Record<string, unknown>, options?: ToStringOptions]
  : AllPropertiesAreOptional<ExtractRecordParamTypesWriting<TParts>> extends true
    ? [params?: ExtractRecordParamTypesWriting<TParts>, options?: ToStringOptions]
    : [params: ExtractRecordParamTypesWriting<TParts>, options?: ToStringOptions]
