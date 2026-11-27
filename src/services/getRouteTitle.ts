import { ResolvedRoute } from '@/types/resolved'
import { ValueLocation } from '@/types/computation'

export async function getRouteTitle(route: ResolvedRoute, getValue: (location: ValueLocation) => Promise<unknown>, depth = route.matches.length): Promise<string | undefined> {
  for (let index = depth - 1; index >= 0; index--) {
    if (route.matches[index].title) {
      return await getValue({ kind: 'title', depth: index, name: 'title' }) as string
    }
  }

  return undefined
}
