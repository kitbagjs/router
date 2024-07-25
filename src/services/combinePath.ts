import { RemoveLeadingQuestionMarkFromKeys } from '@/types/params'
import { Path, PathParamsWithParamNameExtracted, ToPath } from '@/types/path'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

export type CombinePath<
  TParent extends Path,
  TChild extends Path
> = ToPath<TParent> extends { path: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToPath<TChild> extends { path: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams> extends PathParamsWithParamNameExtracted<`${TParentPath}${TChildPath}`>
      ? Path<`${TParentPath}${TChildPath}`, RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams>>
      : Path<'', {}>
    : Path<'', {}>
  : Path<'', {}>

export function combinePath<TParentPath extends Path, TChildPath extends Path>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: Path, childPath: Path): Path {
  checkDuplicateKeys(parentPath.params, childPath.params)

  const newPathString = `${parentPath.path}${childPath.path}`

  return {
    path: newPathString,
    params: { ...parentPath.params, ...childPath.params },
    toString: () => newPathString,
  }
}