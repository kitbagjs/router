import { StringHasValue } from '@/utilities/guards'

export type CombineKey<TParentKey extends string | undefined, TChildKey extends string | undefined> = StringHasValue<TParentKey> extends true
  ? StringHasValue<TChildKey> extends true
    ? `${TParentKey}.${TChildKey}`
    : TParentKey
  : StringHasValue<TChildKey> extends true
    ? TChildKey
    : ''

export function combineKey<TParentKey extends string | undefined, TChildKey extends string | undefined>(parentKey: TParentKey, childKey: TChildKey): CombineKey<TParentKey, TChildKey>
export function combineKey(parentKey: string, childKey: string): string {
  return [parentKey, childKey].filter(value => !!value).join('.')
}