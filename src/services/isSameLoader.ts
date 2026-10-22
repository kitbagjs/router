import { isLoader } from '@/types/loader'

export function isSameLoader(first: unknown, second: unknown): boolean {
  return isLoader(first) && isLoader(second) && first.id === second.id
}
