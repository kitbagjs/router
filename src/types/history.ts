export type RouterHistory = {
  length: number,
  state: unknown,
  forward: () => void,
  back: () => void,
  go: (delta: number) => void,
  pushState: (data: unknown, url?: string | URL | null) => void,
  replaceState: (data: unknown, url?: string | URL | null) => void,
}