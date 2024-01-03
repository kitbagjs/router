import { isBrowser } from '@/utilities/isBrowser'

type UpdateBrowserUrlOptions = {
  replace?: boolean,
}

export function updateBrowserUrl(url: string, options: UpdateBrowserUrlOptions = {}): void {
  if (!isBrowser) {
    return
  }

  if (isSameOrigin(url)) {
    return updateHistory(url, options)
  }

  return updateWindow(url, options)
}

function updateHistory(url: string, options: UpdateBrowserUrlOptions = {}): void {
  if (options.replace) {
    return history.replaceState({}, '', url)
  }

  history.pushState({}, '', url)
}

function updateWindow(url: string, options: UpdateBrowserUrlOptions = {}): void {
  if (options.replace) {
    return window.location.replace(url)
  }

  return window.location.assign(url)
}

function isSameOrigin(url: string): boolean {
  const { origin } = new URL(url, window.location.origin)

  return origin === window.location.origin
}