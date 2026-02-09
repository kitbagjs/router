import { ResolvedRoute } from '@/types/resolved'
import { isBrowser } from '@/utilities/isBrowser'

export function setDocumentTitle(to: ResolvedRoute): void {
  if (!isBrowser()) {
    return
  }

  const title = to.matches.reduce<string | null>((title, { title: matchTitle }) => {
    if (!matchTitle) {
      return title
    }

    if (typeof matchTitle === 'function') {
      return matchTitle(title)
    }

    return matchTitle
  }, null)

  document.title = title ?? ''
}
