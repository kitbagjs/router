import { ResolvedRoute } from '@/types/resolved'
import { isRoute } from '@/types/route'
import { isBrowser } from '@/utilities/isBrowser'

export function setDocumentTitle(to: ResolvedRoute | null): void {
  if (!isRoute(to) || !isBrowser()) {
    return
  }

  to.title.then((value) => {
    if (value === undefined) {
      return
    }

    document.title = value
  })
}
