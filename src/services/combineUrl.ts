import { createUrl } from '@/services/createUrl'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { combineHash } from '@/services/combineHash'
import { toUrlPart, querySourceToUrlPart } from '@/services/withParams'
import { CreateUrlOptions, isUrlWithSchema, ToUrl, Url } from '@/types/url'
import { Identity } from '@/types/utilities'

export type CombineUrl<
  TParent extends Url,
  TChild extends Url
> = TParent extends Url<infer TParentParams>
  ? TChild extends Url<infer TChildParams>
    ? Url<Identity<TParentParams & TChildParams>>
    : never
  : never

export function combineUrl<const TParent extends Url, const TChild extends Url>(parent: TParent, child: TChild): CombineUrl<TParent, TChild>
export function combineUrl<const TParent extends Url, const TChild extends CreateUrlOptions>(parent: TParent, child: TChild): CombineUrl<TParent, ToUrl<TChild>>
export function combineUrl(parent: Url, child: Url | CreateUrlOptions): Url {
  if (!isUrlWithSchema(parent)) {
    throw new Error('Parent is not a valid url')
  }

  if (!isUrl(child)) {
    return createUrl({
      host: parent.schema.host,
      path: combinePath(parent.schema.path, toUrlPart(child.path)),
      query: combineQuery(parent.schema.query, querySourceToUrlPart(child.query)),
      hash: combineHash(parent.schema.hash, toUrlPart(child.hash)),
    })
  }

  if (!isUrlWithSchema(child)) {
    throw new Error('Child is not a valid url')
  }

  return createUrl({
    host: parent.schema.host,
    path: combinePath(parent.schema.path, child.schema.path),
    query: combineQuery(parent.schema.query, child.schema.query),
    hash: combineHash(parent.schema.hash, child.schema.hash),
  })
}

function isUrl(url: unknown): url is Url {
  return isUrlWithSchema(url)
}
