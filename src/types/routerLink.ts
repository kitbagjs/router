import { PrefetchConfig } from '@/types/prefetch'
import { Url } from '@/types/url'
import { ResolvedRoute } from '@/types/resolved'
import { Router } from '@/types/router'
import { RouterPushOptions } from '@/types/routerPush'

export type ToCallback<TRouter extends Router> = (resolve: TRouter['resolve']) => ResolvedRoute | Url | undefined

export type RouterLinkProps<TRouter extends Router> = RouterPushOptions & {
  /**
   * The url string to navigate to or a callback that returns a url string
   */
  to: Url | ResolvedRoute | ToCallback<TRouter>,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides route level prefetch.
   */
  prefetch?: PrefetchConfig,
}
