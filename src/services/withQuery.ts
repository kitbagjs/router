export function withQuery(url: string, ...queries: (string | URLSearchParams | Record<string, string> | undefined)[]): string {
  return queries.reduce<string>((value, query) => {
    if (!query) {
      return value
    }

    const queryString = new URLSearchParams(query).toString()

    if (Object.keys(queryString).length === 0) {
      return value
    }

    if (value.includes('?')) {
      return `${value}&${queryString}`
    }

    return `${value}?${queryString}`
  }, url)
}