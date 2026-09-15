import { isBrowser } from '@/utilities/isBrowser'

export function setDocumentTitle(title: string | undefined): void {
  if (title === undefined || !isBrowser()) {
    return
  }

  document.title = title
}
