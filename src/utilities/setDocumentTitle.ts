import { isBrowser } from '@/utilities/isBrowser'

export function setDocumentTitle(title: string | undefined): void {
  if (isBrowser() && title !== undefined) {
    document.title = title
  }
}
