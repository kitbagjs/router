export type ActivityTracker = {
  add: (...work: Promise<unknown>[]) => void,
  wrap: <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>) => (...args: TArgs) => Promise<TResult>,
  idle: () => Promise<void>,
}

export function createActivityTracker(): ActivityTracker {
  const outstanding = new Set<Promise<unknown>>()

  const add: ActivityTracker['add'] = (...work) => {
    work.forEach((promise) => {
      outstanding.add(promise)

      void promise.catch(() => undefined).finally(() => outstanding.delete(promise))
    })
  }

  const wrap: ActivityTracker['wrap'] = (fn) => (...args) => {
    const result = fn(...args)

    add(result)

    return result
  }

  // Loops because settling one promise can register more: a loader that pushes starts a navigation
  // whose own values must also settle.
  const idle: ActivityTracker['idle'] = async () => {
    while (outstanding.size > 0) {
      await Promise.allSettled([...outstanding])
    }
  }

  return {
    add,
    wrap,
    idle,
  }
}
