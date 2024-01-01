export type HistoryStateKey = {
  get: () => number,
  next: () => number,
}

export function createHistoryStateKey(): HistoryStateKey {
  let currentKey = getKeyValue()

  function get(): number {
    return currentKey
  }

  function next(): number {
    currentKey = getKeyValue()

    return currentKey
  }

  function getKeyValue(): number {
    return Math.floor(Math.random() * (999_999 - 100_001)) + 100_000
  }

  return {
    get,
    next,
  }
}