import { createHashHistory, createMemoryHistory } from '@/services/history'
import { createBrowserNavigation } from '@/services/createBrowserNavigation'
import { createHistoryNavigation } from '@/services/createHistoryNavigation'
import { NavigationPrepare, RouterHistory, RouterHistoryMode } from '@/types/routerHistory'
import { isBrowser } from '@/utilities/isBrowser'

type RouterHistoryOptions = {
  prepare: NavigationPrepare,
  mode?: RouterHistoryMode,
}

export function createRouterHistory({ mode = 'auto', prepare }: RouterHistoryOptions): RouterHistory {
  if (mode === 'auto') {
    return createRouterHistory({ mode: isBrowser() ? 'browser' : 'memory', prepare })
  }

  switch (mode) {
    case 'browser':
      return createBrowserNavigation({ prepare })

    case 'hash':
      return createHistoryNavigation({ history: createHashHistory(), prepare })

    case 'memory':
      return createHistoryNavigation({ history: createMemoryHistory(), prepare })
  }
}
