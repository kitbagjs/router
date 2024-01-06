type UpdateBrowserUrlOptions = {
  replace?: boolean,
}

export function updateBrowserUrl(url: string, options: UpdateBrowserUrlOptions = {}): Promise<void> {
  if (isSameOrigin(url)) {
    return new Promise(resolve => {
      updateHistory(url, options)
      resolve()
    })
  }

  // intentionally never resolves because we want the router to just stall until window.location takes over
  return new Promise(() => {
    updateWindow(url, options)
  })
}

function updateHistory(url: string, options: UpdateBrowserUrlOptions): void {
  if (options.replace) {
    return history.replaceState({}, '', url)
  }

  history.pushState({}, '', url)
}

function updateWindow(url: string, options: UpdateBrowserUrlOptions): void {
  if (options.replace) {
    return window.location.replace(url)
  }

  return window.location.assign(url)
}

export function isSameOrigin(url: string): boolean {
  const { origin } = new URL(url, window.location.origin)

  return origin === window.location.origin
}