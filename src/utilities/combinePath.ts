import { DuplicateParamsError } from '@/errors'
import { MergeParams } from '@/types/params'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'
import { Path, PathParams, ToPath, path } from '@/utilities/path'

export type CombinePath<
  TParent extends Path,
  TChild extends Path
> = ToPath<TParent> extends { path: infer TParentPath extends string, params: infer TParentParams extends Record<string, unknown> }
  ? ToPath<TChild> extends { path: infer TChildPath extends string, params: infer TChildParams extends Record<string, unknown> }
    ? MergeParams<TParentParams, TChildParams> extends PathParams<`${TParentPath}${TChildPath}`>
      ? Path<`${TParentPath}${TChildPath}`, MergeParams<TParentParams, TChildParams>>
      : Path<'', {}>
    : Path<'', {}>
  : Path<'', {}>

export function combinePath<TParentPath extends Path, TChildPath extends Path>(parentPath: TParentPath, childPath: TChildPath): CombinePath<TParentPath, TChildPath>
export function combinePath(parentPath: Path, childPath: Path): Path {
  const { hasDuplicates, key } = checkDuplicateKeys(parentPath.params, childPath.params)
  if (hasDuplicates) {
    throw new DuplicateParamsError(key)
  }

  return path(`${parentPath.path}${childPath.path}`, { ...parentPath.params, ...childPath.params })
}