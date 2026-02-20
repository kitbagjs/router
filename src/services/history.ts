export type Action = 'POP' | 'PUSH' | 'REPLACE'
export type Pathname = string
export type Search = string
export type Hash = string
export type Key = string

export interface Path {
  pathname: Pathname,
  search: Search,
  hash: Hash,
}

export interface Location extends Path {
  state: unknown,
  key: Key,
}

export interface Update {
  action: Action,
  location: Location,
}

export type Listener = (update: Update) => void

export interface Transition extends Update {
  retry: () => void,
}

export type Blocker = (tx: Transition) => void

export type To = string | Partial<Path>

export interface History {
  readonly action: Action,
  readonly location: Location,
  createHref: (to: To) => string,
  push: (to: To, state?: unknown) => void,
  replace: (to: To, state?: unknown) => void,
  go: (delta: number) => void,
  back: () => void,
  forward: () => void,
  listen: (listener: Listener) => () => void,
  block: (blocker: Blocker) => () => void,
}

export interface BrowserHistory extends History {}

export interface HashHistory extends History {}

export interface MemoryHistory extends History {
  readonly index: number,
}

export type BrowserHistoryOptions = {
  window?: Window,
}

export type HashHistoryOptions = {
  window?: Window,
}

export type InitialEntry = string | Partial<Location>

export type MemoryHistoryOptions = {
  initialEntries?: InitialEntry[],
  initialIndex?: number,
}

// UTILS

function createEvents<T>(): {
  readonly length: number,
  push: (fn: (arg: T) => void) => () => void,
  call: (arg: T) => void,
} {
  let handlers: ((arg: T) => void)[] = []
  return {
    get length() {
      return handlers.length
    },
    push(fn: (arg: T) => void): () => void {
      handlers.push(fn)
      return () => {
        handlers = handlers.filter((handler) => handler !== fn)
      }
    },
    call(arg: T): void {
      handlers.forEach((fn) => fn(arg))
    },
  }
}

function createKey(): string {
  return Math.random()
    .toString(36)
    .slice(2, 10)
}

function clamp(n: number, lowerBound: number, upperBound: number): number {
  return Math.min(Math.max(n, lowerBound), upperBound)
}

function promptBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault()
  // Chrome (and legacy IE) requires returnValue to be set
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  event.returnValue = ''
}

export function createPath({ pathname = '/', search = '', hash = '' }: Partial<Path>): string {
  let result = pathname
  if (search && search !== '?') result += search.startsWith('?') ? search : '?' + search
  if (hash && hash !== '#') result += hash.startsWith('#') ? hash : '#' + hash
  return result
}

export function parsePath(path: string): Partial<Path> {
  const parsedPath: Partial<Path> = {}

  if (path) {
    const hashIndex = path.indexOf('#')

    if (hashIndex >= 0) {
      parsedPath.hash = path.slice(hashIndex)
      path = path.slice(0, hashIndex)
    }

    const searchIndex = path.indexOf('?')

    if (searchIndex >= 0) {
      parsedPath.search = path.slice(searchIndex)
      path = path.slice(0, searchIndex)
    }

    if (path) {
      parsedPath.pathname = path
    }
  }

  return parsedPath
}

function readOnly<T extends object>(obj: T): Readonly<T> {
  return Object.freeze(obj)
}

// BROWSER HISTORY

const BeforeUnloadEventType = 'beforeunload'
const PopStateEventType = 'popstate'
const HashChangeEventType = 'hashchange'

export function createBrowserHistory(options: BrowserHistoryOptions = {}): BrowserHistory {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { window: win = document.defaultView! } = options
  const globalHistory = win.history

  function getIndexAndLocation(): [number | null, Location] {
    const { pathname, search, hash } = win.location
    const state = globalHistory.state ?? {}
    return [
      state.idx,
      readOnly({
        pathname,
        search,
        hash,
        state: state.usr ?? null,
        key: state.key || 'default',
      }),
    ]
  }

  let blockedPopTx: Transition | null = null

  function handlePop(): void {
    if (blockedPopTx) {
      blockers.call(blockedPopTx)
      blockedPopTx = null
    } else {
      const nextAction = 'POP'
      const [nextIndex, nextLocation] = getIndexAndLocation()

      if (blockers.length) {
        if (nextIndex != null) {
          const delta = index ?? 0 - nextIndex

          if (delta) {
            blockedPopTx = {
              action: nextAction,
              location: nextLocation,
              retry() {
                go(delta * -1)
              },
            }
            go(delta)
          }
        }
      } else {
        applyTx(nextAction)
      }
    }
  }

  win.addEventListener(PopStateEventType, handlePop)

  let action: Action = 'POP'
  let [index, location] = getIndexAndLocation()
  const listeners = createEvents<Update>()
  const blockers = createEvents<Transition>()

  if (index == null) {
    index = 0
    globalHistory.replaceState({ ...globalHistory.state, idx: index }, '')
  }

  function createHref(to: To): string {
    return typeof to === 'string' ? to : createPath(to)
  }

  function getNextLocation(to: To, state: unknown = null): Location {
    return readOnly({
      pathname: location.pathname,
      hash: '',
      search: '',
      ...typeof to === 'string' ? parsePath(to) : to,
      state,
      key: createKey(),
    })
  }

  function getHistoryStateAndUrl(nextLocation: Location, idx: number): [Record<string, unknown>, string] {
    return [
      { usr: nextLocation.state, key: nextLocation.key, idx },
      createHref(nextLocation),
    ]
  }

  function allowTx(txAction: Action, txLocation: Location, retry: () => void): boolean {
    if (blockers.length) {
      blockers.call({ action: txAction, location: txLocation, retry })
      return false
    }
    return true
  }

  function applyTx(nextAction: Action): void {
    action = nextAction
    ;[index, location] = getIndexAndLocation()
    listeners.call({ action, location })
  }

  function push(to: To, state?: unknown): void {
    const nextAction: Action = 'PUSH'
    const nextLocation = getNextLocation(to, state)

    function retry(): void {
      push(to, state)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      const [historyState, url] = getHistoryStateAndUrl(nextLocation, (index ?? 0) + 1)

      try {
        globalHistory.pushState(historyState, '', url)
      } catch {
        win.location.assign(url)
      }

      applyTx(nextAction)
    }
  }

  function replace(to: To, state?: unknown): void {
    const nextAction: Action = 'REPLACE'
    const nextLocation = getNextLocation(to, state)

    function retry(): void {
      replace(to, state)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      const [historyState, url] = getHistoryStateAndUrl(nextLocation, index ?? 0)
      globalHistory.replaceState(historyState, '', url)
      applyTx(nextAction)
    }
  }

  function go(delta: number): void {
    globalHistory.go(delta)
  }

  const history: BrowserHistory = {
    get action() {
      return action
    },
    get location() {
      return location
    },
    createHref,
    push,
    replace,
    go,
    back() {
      go(-1)
    },
    forward() {
      go(1)
    },
    listen(listener: Listener) {
      return listeners.push(listener)
    },
    block(blocker: Blocker) {
      const unblock = blockers.push(blocker)

      if (blockers.length === 1) {
        win.addEventListener(BeforeUnloadEventType, promptBeforeUnload)
      }

      return () => {
        unblock()
        if (!blockers.length) {
          win.removeEventListener(BeforeUnloadEventType, promptBeforeUnload)
        }
      }
    },
  }

  return history
}

// HASH HISTORY

export function createHashHistory(options: HashHistoryOptions = {}): HashHistory {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { window: win = document.defaultView! } = options
  const globalHistory = win.history

  function getIndexAndLocation(): [number | null, Location] {
    const { pathname = '/', search = '', hash = '' } = parsePath(win.location.hash.slice(1))
    const state = globalHistory.state || {}
    return [
      state.idx,
      readOnly({
        pathname,
        search,
        hash,
        state: state.usr ?? null,
        key: state.key ?? 'default',
      }),
    ]
  }

  let blockedPopTx: Transition | null = null

  function handlePop(): void {
    if (blockedPopTx) {
      blockers.call(blockedPopTx)
      blockedPopTx = null
    } else {
      const nextAction: Action = 'POP'
      const [nextIndex, nextLocation] = getIndexAndLocation()

      if (blockers.length) {
        if (nextIndex != null) {
          const delta = (index ?? 0) - nextIndex

          if (delta) {
            blockedPopTx = {
              action: nextAction,
              location: nextLocation,
              retry() {
                go(delta * -1)
              },
            }
            go(delta)
          }
        }
      } else {
        applyTx(nextAction)
      }
    }
  }

  win.addEventListener(PopStateEventType, handlePop)
  win.addEventListener(HashChangeEventType, () => {
    const [, nextLocation] = getIndexAndLocation()
    if (createPath(nextLocation) !== createPath(location)) {
      handlePop()
    }
  })

  let action: Action = 'POP'
  let [index, location] = getIndexAndLocation()
  const listeners = createEvents<Update>()
  const blockers = createEvents<Transition>()

  if (index == null) {
    index = 0
    globalHistory.replaceState({ ...globalHistory.state, idx: index }, '')
  }

  function getBaseHref(): string {
    const base = document.querySelector('base')
    let href = ''

    if (base?.getAttribute('href')) {
      const url = win.location.href
      const hashIndex = url.indexOf('#')
      href = hashIndex === -1 ? url : url.slice(0, hashIndex)
    }

    return href
  }

  function createHref(to: To): string {
    return getBaseHref() + '#' + (typeof to === 'string' ? to : createPath(to))
  }

  function getNextLocation(to: To, state: unknown = null): Location {
    return readOnly({
      pathname: location.pathname,
      hash: '',
      search: '',
      ...typeof to === 'string' ? parsePath(to) : to,
      state,
      key: createKey(),
    })
  }

  function getHistoryStateAndUrl(nextLocation: Location, idx: number): [Record<string, unknown>, string] {
    return [
      { usr: nextLocation.state, key: nextLocation.key, idx },
      createHref(nextLocation),
    ]
  }

  function allowTx(txAction: Action, txLocation: Location, retry: () => void): boolean {
    if (blockers.length) {
      blockers.call({ action: txAction, location: txLocation, retry })
      return false
    }
    return true
  }

  function applyTx(nextAction: Action): void {
    action = nextAction
    ;[index, location] = getIndexAndLocation()
    listeners.call({ action, location })
  }

  function push(to: To, state?: unknown): void {
    const nextAction: Action = 'PUSH'
    const nextLocation = getNextLocation(to, state)

    function retry(): void {
      push(to, state)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      const [historyState, url] = getHistoryStateAndUrl(nextLocation, (index ?? 0) + 1)

      try {
        globalHistory.pushState(historyState, '', url)
      } catch {
        win.location.assign(url)
      }

      applyTx(nextAction)
    }
  }

  function replace(to: To, state?: unknown): void {
    const nextAction: Action = 'REPLACE'
    const nextLocation = getNextLocation(to, state)

    function retry(): void {
      replace(to, state)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      const [historyState, url] = getHistoryStateAndUrl(nextLocation, index ?? 0)
      globalHistory.replaceState(historyState, '', url)
      applyTx(nextAction)
    }
  }

  function go(delta: number): void {
    globalHistory.go(delta)
  }

  const history: HashHistory = {
    get action() {
      return action
    },
    get location() {
      return location
    },
    createHref,
    push,
    replace,
    go,
    back() {
      go(-1)
    },
    forward() {
      go(1)
    },
    listen(listener: Listener) {
      return listeners.push(listener)
    },
    block(blocker: Blocker) {
      const unblock = blockers.push(blocker)

      if (blockers.length === 1) {
        win.addEventListener(BeforeUnloadEventType, promptBeforeUnload)
      }

      return () => {
        unblock()
        if (!blockers.length) {
          win.removeEventListener(BeforeUnloadEventType, promptBeforeUnload)
        }
      }
    },
  }

  return history
}

// MEMORY HISTORY

export function createMemoryHistory(options: MemoryHistoryOptions = {}): MemoryHistory {
  const { initialEntries = ['/'], initialIndex } = options

  const entries: Location[] = initialEntries.map((entry) => readOnly({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: createKey(),
    ...typeof entry === 'string' ? parsePath(entry) : entry,
  }),
  )

  let index = clamp(initialIndex ?? entries.length - 1, 0, entries.length - 1)
  let action: Action = 'POP'
  let location = entries[index]
  const listeners = createEvents<Update>()
  const blockers = createEvents<Transition>()

  function createHref(to: To): string {
    return typeof to === 'string' ? to : createPath(to)
  }

  function getNextLocation(to: To, state: unknown = null): Location {
    return readOnly({
      pathname: location.pathname,
      search: '',
      hash: '',
      ...typeof to === 'string' ? parsePath(to) : to,
      state,
      key: createKey(),
    })
  }

  function allowTx(txAction: Action, txLocation: Location, retry: () => void): boolean {
    if (blockers.length) {
      blockers.call({ action: txAction, location: txLocation, retry })
      return false
    }
    return true
  }

  function applyTx(nextAction: Action, nextLocation: Location): void {
    action = nextAction
    location = nextLocation
    listeners.call({ action, location })
  }

  function push(to: To, state?: unknown): void {
    const nextAction: Action = 'PUSH'
    const nextLocation = getNextLocation(to, state)

    function retry(): void {
      push(to, state)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      index += 1
      entries.splice(index, entries.length, nextLocation)
      applyTx(nextAction, nextLocation)
    }
  }

  function replace(to: To, state?: unknown): void {
    const nextAction: Action = 'REPLACE'
    const nextLocation = getNextLocation(to, state)

    function retry(): void {
      replace(to, state)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      entries[index] = nextLocation
      applyTx(nextAction, nextLocation)
    }
  }

  function go(delta: number): void {
    const nextIndex = clamp(index + delta, 0, entries.length - 1)
    const nextAction: Action = 'POP'
    const nextLocation = entries[nextIndex]

    function retry(): void {
      go(delta)
    }

    if (allowTx(nextAction, nextLocation, retry)) {
      index = nextIndex
      applyTx(nextAction, nextLocation)
    }
  }

  const history: MemoryHistory = {
    get index() {
      return index
    },
    get action() {
      return action
    },
    get location() {
      return location
    },
    createHref,
    push,
    replace,
    go,
    back() {
      go(-1)
    },
    forward() {
      go(1)
    },
    listen(listener: Listener) {
      return listeners.push(listener)
    },
    block(blocker: Blocker) {
      return blockers.push(blocker)
    },
  }

  return history
}
