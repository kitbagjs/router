import { StringHasValue } from '@/utilities/string'

export type CombineName<TParentName extends string | undefined, TChildName extends string | undefined> = StringHasValue<TParentName> extends true
  ? StringHasValue<TChildName> extends true
    ? `${TParentName}.${TChildName}`
    : TParentName
  : StringHasValue<TChildName> extends true
    ? TChildName
    : ''

export function combineName<TParentName extends string | undefined, TChildName extends string | undefined>(parentName: TParentName, childName: TChildName): CombineName<TParentName, TChildName>
export function combineName(parentName: string, childName: string): string {
  return [parentName, childName].filter(value => !!value).join('.')
}