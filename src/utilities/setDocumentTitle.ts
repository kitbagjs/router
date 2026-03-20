import { isRejection, Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'
import { isRoute } from '@/types/route'
import { isBrowser } from '@/utilities/isBrowser'

let defaultTitle: string | undefined

type SetDocumentTitleContext = {
  to?: ResolvedRoute | null,
  from?: ResolvedRoute | null,
  rejection?: Rejection | null,
}

export function setDocumentTitle({ to = null, from = null, rejection = null }: SetDocumentTitleContext): void {
  if (!isBrowser()) {
    return
  }

  defaultTitle ??= document.title

  if (isRejection(rejection)) {
    return void rejection.getTitle({ to, from }).then((value) => document.title = value ?? defaultTitle ?? '')
  }

  if (isRoute(to)) {
    return void to.title.then((value) => document.title = value ?? defaultTitle ?? '')
  }
}
