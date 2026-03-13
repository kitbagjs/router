import { isBrowser } from '@/utilities/isBrowser'

let defaultTitle: string | undefined

export function setDocumentTitle(title: string | undefined): void {
  if (!isBrowser()) {
    return
  }

  defaultTitle ??= document.title

  document.title = title ?? defaultTitle
}
