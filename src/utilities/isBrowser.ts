export function isBrowser(): boolean {
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}
