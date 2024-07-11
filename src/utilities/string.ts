export function stringHasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0
}

export type StringHasValue<T> = string extends T
  ? true
  : '' extends T
    ? false
    : T extends string
      ? true
      : false