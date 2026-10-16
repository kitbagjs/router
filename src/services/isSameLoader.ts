import { isLoader, LOADER_ID_SYMBOL } from '@/types/loader'

export function isSameLoader(first: unknown, second: unknown): boolean {
  return isLoader(first) && isLoader(second) && first[LOADER_ID_SYMBOL] === second[LOADER_ID_SYMBOL]
}
