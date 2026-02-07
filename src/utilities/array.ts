export function getCount<T>(array: T[], item: T): number {
  return array.filter((itemAtIndex) => item === itemAtIndex).length
}
