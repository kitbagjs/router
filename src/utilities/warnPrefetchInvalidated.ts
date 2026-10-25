import { UrlString } from '@/types/urlString'
import { warn } from '@/utilities/warn'

export function warnPrefetchInvalidated(href: UrlString): void {
  warn(`Prefetched props and loader data for "${href}" cannot be used when query, hash, or state options are passed to link.push() or link.replace(). Pass these as reactive options to useLink instead.`)
}
