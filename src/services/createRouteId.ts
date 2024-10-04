function uniqueIdSequence(): () => string {
  let currentId = 0

  return () => (++currentId).toString()
}

export const createRouteId = uniqueIdSequence()