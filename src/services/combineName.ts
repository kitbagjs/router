export type CombineName<TParentName extends string | undefined, TChildName extends string | undefined> = TParentName extends string
  ? TChildName extends string
    ? `${TParentName}.${TChildName}`
    : TParentName
  : TChildName extends string
    ? TChildName
    : ''

export function combineName<TParentName extends string | undefined, TChildName extends string | undefined>(parentName: TParentName, childName: TChildName): CombineName<TParentName, TChildName>
export function combineName(parentName: string, childName: string): string {
  return [parentName, childName].filter(value => !!value).join('.')
}