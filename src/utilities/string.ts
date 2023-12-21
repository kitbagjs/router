export function stringHasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0
}