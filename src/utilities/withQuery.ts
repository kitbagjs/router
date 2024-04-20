export function withQuery(url: string, query?: Record<string, string>): string {
  if (!query) {
    return url
  }

  if (Object.keys(query).length === 0) {
    return url
  }

  const queryString = new URLSearchParams(query).toString()

  if (url.includes('?')) {
    return `${url}&${queryString}`
  }

  return `${url}?${queryString}`
}