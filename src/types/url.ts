export type Url = `http://${string}` | `https://${string}` | `/${string}` | '/'

export function isUrl(value: string): value is Url {
  const regexPattern = /^(https?:\/\/|\/).*/g

  return regexPattern.test(value)
}