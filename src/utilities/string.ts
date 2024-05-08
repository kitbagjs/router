export function stringHasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0
}

export type StringHasValue<T extends string | undefined> = T extends undefined ? false : '' extends T ? false : true