import { RedirectStatus, RenderRedirect } from '@/types/router'

type ServerRedirect = {
  /**
   * Captures a redirect as the render's response. A server responds per redirect hop, so only the first
   * is kept: the browser follows it, and the next request takes it from there.
   */
  setServerRedirect: (status: RedirectStatus, location: string) => void,
  /**
   * The redirect the render captured, or undefined when it has not redirected.
   */
  getServerRedirect: () => RenderRedirect | undefined,
}

export function createServerRedirect(): ServerRedirect {
  let redirect: RenderRedirect | undefined

  const setServerRedirect: ServerRedirect['setServerRedirect'] = (status, location) => {
    redirect ??= { kind: 'redirect', status, location }
  }

  const getServerRedirect: ServerRedirect['getServerRedirect'] = () => redirect

  return { setServerRedirect, getServerRedirect }
}
