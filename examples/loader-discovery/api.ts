import { record } from './events'

export async function getCountries(): Promise<{ code: string, name: string }[]> {
  record('countries request started by the router')
  await new Promise(resolve => setTimeout(resolve, 900))
  record('countries request resolved')
  return [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
  ]
}
