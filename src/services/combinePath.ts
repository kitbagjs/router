import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { ToUrlPart, UrlPart, UrlParams } from '@/services/withParams'
import { Identity } from '@/types/utilities'

export type CombinePath<
  TParent extends UrlPart,
  TChild extends UrlPart
> = ToUrlPart<TParent> extends { params: infer TParentParams extends UrlParams }
  ? ToUrlPart<TChild> extends { params: infer TChildParams extends UrlParams }
    ? TParentParams & TChildParams extends UrlParams
      ? UrlPart<Identity<TParentParams & TChildParams>>
      : UrlPart<{}>
    : UrlPart<{}>
  : UrlPart<{}>

export function combinePath<TParentPath extends UrlPart, TChildPath extends UrlPart>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: UrlPart, childPath: UrlPart): UrlPart {
  checkDuplicateParams(parentPath.params, childPath.params)

  const newPathString = `${parentPath.value}${childPath.value}`

  return {
    ...parentPath,
    value: newPathString,
    params: { ...parentPath.params, ...childPath.params },
  }
}
