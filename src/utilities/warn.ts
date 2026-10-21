export function warn(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  console.warn(...args)
}
