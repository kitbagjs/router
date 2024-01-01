let currentKey = getKeyValue()

export const HistoryStateKey = {
  get: () => currentKey,
  next: () => {
    currentKey = getKeyValue()

    return currentKey
  },
}

function getKeyValue(): number {
  return Date.now()
}