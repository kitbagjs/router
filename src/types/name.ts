export type ToName<T extends string | undefined> = T extends string ? T : ''

export function toName<T extends string | undefined>(value: T): ToName<T>
export function toName<T extends string | undefined>(value: T): string {
  if (value === undefined) {
    return ''
  }

  return value
}
