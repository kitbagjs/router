export function asArray<T>(value: Readonly<T | T[]>): T[] {
  return Array.isArray(value) ? value : [value]
}