import { ResolvedRoute } from '@/types/resolved'
import { isRouteWithTitleGetter } from '@/types/titles'
import { isBrowser } from '@/utilities/isBrowser'

let defaultTitle: string | undefined

export function setDocumentTitle(to: ResolvedRoute): void {
  if (!isRouteWithTitleGetter(to) || !isBrowser()) {
    return
  }

  defaultTitle ??= document.title

  to.title.then((value) => {
    document.title = value ?? defaultTitle ?? ''
  })
}
