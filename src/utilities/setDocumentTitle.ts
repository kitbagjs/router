import { isBrowser } from '@/utilities/isBrowser'

let defaultTitle: string

export function setDocumentTitle(title: string | undefined): void {
  if (isBrowser()) {
    defaultTitle ??= document.title
    document.title = title ?? defaultTitle
  }
}
