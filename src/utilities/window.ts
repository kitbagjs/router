// https://stackoverflow.com/a/62557418/3511012
function globalExists(varName: string): boolean {
  const globalEval = eval
  try {
    globalEval(varName)
    return true
  } catch {
    return false
  }
}

export function getWindow(): Window {
  if (!globalExists('window')) {
    throw 'mock for window not implemented'
  }

  return window
}