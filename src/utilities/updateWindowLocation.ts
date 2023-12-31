type UpdateWindowLocationOptions = {
  replace?: boolean,
}

export function updateWindowLocation(url: string, options: UpdateWindowLocationOptions = {}): void {
  if (options.replace) {
    return window.location.replace(url)
  }

  return window.location.assign(url)
}