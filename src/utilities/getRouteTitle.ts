import { ResolvedRoute } from '@/main'
import { isRouteWithTitleGetter } from '@/types/titles'

export async function getRouteTitle(to: ResolvedRoute): Promise<string | undefined> {
  if (!isRouteWithTitleGetter(to)) {
    return undefined
  }

  return await to.getTitle(to)
}
