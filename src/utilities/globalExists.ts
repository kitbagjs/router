// https://stackoverflow.com/a/62557418/3511012
export function globalExists(varName: string): boolean {
  const globalEval = eval
  try {
    globalEval(varName)
    return true
  } catch {
    return false
  }
}