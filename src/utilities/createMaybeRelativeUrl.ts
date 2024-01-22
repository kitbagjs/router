import { isBrowser } from '@/utilities'

export function createMaybeRelativeUrl(value: string): URL {
  const isRelative = !value.startsWith('http')
  const base = isRelative ? getBase() : undefined

  return new URL(value, base)
}

function getBase(): string {
  if (!isBrowser()) {
    // return 'https://kitbag.io'
    throw 'Must have browser context to generate base url'
  }

  return window.location.origin
}