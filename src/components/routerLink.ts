import { PrefetchConfig } from '@/types/prefetch'
import { Url } from '@/types/url'
import { ResolvedRoute } from '@/types/resolved'
import { RegisteredRouter } from '@/types/register'

export type ToCallback = (resolve: RegisteredRouter['resolve']) => ResolvedRoute | Url | undefined

export type RouterLinkProps = {
  /**
   * The url string to navigate to or a callback that returns a url string
   */
  to: Url | ResolvedRoute | ToCallback,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides route level prefetch.
   */
  prefetch?: PrefetchConfig,
}
