export type Url = `http://${string}` | `https://${string}` | `/${string}` | '/'

export function isUrl(value: unknown): value is Url {
  if (typeof value !== 'string') {
    return false
  }

  const regexPattern = /^(https?:\/\/|\/).*/g

  return regexPattern.test(value)
}