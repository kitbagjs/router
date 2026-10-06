export type PageStatus = 'progressive' | 'preparing' | 'prepared' | 'abandoned'

export type PageStatusStore = {
  set: (status: PageStatus) => void,
  isProgressive: () => boolean,
  isPreparing: () => boolean,
  isPrepared: () => boolean,
  isAbandoned: () => boolean,
}

export function createPageStatus(): PageStatusStore {
  let status: PageStatus = 'progressive'

  return {
    set: (next) => {
      status = next
    },
    isProgressive: () => status === 'progressive',
    isPreparing: () => status === 'preparing',
    isPrepared: () => status === 'prepared',
    isAbandoned: () => status === 'abandoned',
  }
}
