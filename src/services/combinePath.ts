import { RemoveLeadingQuestionMarkFromKeys } from '@/types/params'
import { Path, PathParamsWithParamNameExtracted, ToPath } from '@/types/path'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export type CombinePath<
  TParent extends Path,
  TChild extends Path
> = ToPath<TParent> extends { value: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToPath<TChild> extends { value: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams> extends PathParamsWithParamNameExtracted<`${TParentPath}${TChildPath}`>
      ? Path<`${TParentPath}${TChildPath}`, RemoveLeadingQuestionMarkFromKeys<TParentParams> & RemoveLeadingQuestionMarkFromKeys<TChildParams>>
      : Path<'', {}>
    : Path<'', {}>
  : Path<'', {}>

export function combinePath<TParentPath extends Path, TChildPath extends Path>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: Path, childPath: Path): Path {
  checkDuplicateParams(parentPath.params, childPath.params)

  const newPathString = `${parentPath.value}${childPath.value}`

  return {
    value: newPathString,
    params: { ...parentPath.params, ...childPath.params },
    toString: () => newPathString,
  }
}
