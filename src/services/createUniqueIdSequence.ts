export function createUniqueIdSequence(): () => string {
  let currentId = 0

  return () => (++currentId).toString()
}
