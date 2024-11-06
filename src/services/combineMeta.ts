import { MetaPropertyConflict } from '@/errors/metaPropertyConflict'

export type CombineMeta<
  TParent extends Record<string, unknown>,
  TChild extends Record<string, unknown>
> = TParent & TChild

export function combineMeta<TParentMeta extends Record<string, unknown>, TChildMeta extends Record<string, unknown>>(parentMeta: TParentMeta, childMeta: TChildMeta): CombineMeta<TParentMeta, TChildMeta>
export function combineMeta(parentMeta: Record<string, unknown>, childMeta: Record<string, unknown>): Record<string, unknown> {
  checkForConflicts(parentMeta, childMeta)

  return { ...parentMeta, ...childMeta }
}

function checkForConflicts(parentMeta: Record<string, unknown>, childMeta: Record<string, unknown>): void {
  const conflict = Object.keys(parentMeta).find((key) => {
    return key in childMeta && typeof childMeta[key] !== typeof parentMeta[key]
  })

  if (conflict) {
    throw new MetaPropertyConflict(conflict)
  }
}
