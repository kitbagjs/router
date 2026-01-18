import { ComputedRef, Ref } from 'vue'
import { PrefetchConfig } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'
import { RouterReplaceOptions } from '@/types/routerReplace'
import { UrlString } from '@/types/urlString'

export type UseLink = {
  /**
   * A template ref to bind to the dom for automatic prefetching
   */
  element: Ref<HTMLElement | undefined>,
  /**
   * ResolvedRoute if matched. Same value as `router.find`
   */
  route: ComputedRef<ResolvedRoute | undefined>,
  /**
   * Resolved URL with params interpolated and query applied. Same value as `router.resolve`.
   */
  href: ComputedRef<UrlString | undefined>,
  /**
   * True if route matches current URL or is ancestor of route that matches current URL
   */
  isMatch: ComputedRef<boolean>,
  /**
   * True if route matches current URL. Route is the same as what's currently stored at `router.route`.
   */
  isExactMatch: ComputedRef<boolean>,
  /**
   * True if route matches current URL, or is a parent route that matches the parent of the current URL.
   */
  isActive: ComputedRef<boolean>,
  /**
   * True if route matches current URL exactly.
   */
  isExactActive: ComputedRef<boolean>,
  /**
   *
   */
  isExternal: ComputedRef<boolean>,
  /**
   * Convenience method for executing `router.push` with route context passed in.
   */
  push: (options?: RouterPushOptions) => Promise<void>,
  /**
   * Convenience method for executing `router.replace` with route context passed in.
   */
  replace: (options?: RouterReplaceOptions) => Promise<void>,
}

export type UseLinkOptions = RouterPushOptions & {
  prefetch?: PrefetchConfig,
}
