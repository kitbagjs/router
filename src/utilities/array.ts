export function asArray<T>(value: Readonly<T | T[]>): T[] {
  return Array.isArray(value) ? value : [value] as T[]
}

export function getCount<T>(array: T[], item: T): number {
  return array.filter((itemAtIndex) => item === itemAtIndex).length
}
