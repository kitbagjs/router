import { createUrl } from '@/services/createUrl'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { combineHash } from '@/services/combineHash'
import { toWithParams } from '@/services/withParams'
import { CreateUrlOptions, ToUrl, Url } from '@/types/url'

export type CombineUrl<
  TParent extends Url,
  TChild extends Url
> = TParent extends Url<infer TParentParams>
  ? TChild extends Url<infer TChildParams>
    ? Url<TParentParams & TChildParams>
    : never
  : never

export function combineUrl<const TParent extends Url, const TChild extends Url>(parent: TParent, child: TChild): CombineUrl<TParent, TChild>
export function combineUrl<const TParent extends Url, const TChild extends CreateUrlOptions>(parent: TParent, child: TChild): CombineUrl<TParent, ToUrl<TChild>>
export function combineUrl(parent: Url, child: Url | CreateUrlOptions): Url {
  if (isUrl(child)) {
    return createUrl({
      host: parent._schema.host,
      path: combinePath(parent._schema.path, child._schema.path),
      query: combineQuery(parent._schema.query, child._schema.query),
      hash: combineHash(parent._schema.hash, child._schema.hash),
    })
  }

  return createUrl({
    host: parent._schema.host,
    path: combinePath(parent._schema.path, toWithParams(child.path)),
    query: combineQuery(parent._schema.query, toWithParams(child.query)),
    hash: combineHash(parent._schema.hash, toWithParams(child.hash)),
  })
}

function isUrl(value: Url | CreateUrlOptions): value is Url {
  return '_schema' in value
}
