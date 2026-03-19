import { ResolvedRoute } from '@/types/resolved'
import { isRoute } from '@/types/route'
import { isBrowser } from '@/utilities/isBrowser'

let defaultTitle: string | undefined

export function setDocumentTitle(to: ResolvedRoute): void {
  if (!isRoute(to) || !isBrowser()) {
    return
  }

  defaultTitle ??= document.title

  to.title.then((value) => {
    document.title = value ?? defaultTitle ?? ''
  })
}
