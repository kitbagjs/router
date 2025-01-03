export function createUniqueIdSequence(): () => string {
  let currentId = 0

  return () => (++currentId).toString()
}

export const FIRST_SEQUENCE_ID = createUniqueIdSequence()()

export function isFirstUniqueSequenceId(id: string): boolean {
  return id === FIRST_SEQUENCE_ID
}
