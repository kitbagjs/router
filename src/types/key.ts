export type ToKey<T extends string | undefined> = T extends string ? T : ''

export function toKey<T extends string | undefined>(value: T): ToKey<T>
export function toKey<T extends string | undefined>(value: T): string {
  if (value === undefined) {
    return ''
  }

  return value
}