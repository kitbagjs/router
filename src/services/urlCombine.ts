import { Url } from '@/types/url'
import { UrlString } from '@/types/urlString'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { stringHasValue } from '@/utilities/guards'
import { createUrl, CreateUrlOptions } from '@/services/createUrl'

export function combineUrl(previous: UrlString | CreateUrlOptions, updated: UrlString | CreateUrlOptions): Url {
  const previousUrlParts = createUrl(previous)
  const updatedUrlParts = createUrl(updated)

  const previousQuery = new URLSearchParams(previousUrlParts.query.toString())
  const updatedQuery = new URLSearchParams(updatedUrlParts.query.toString())

  const previousHost = previousUrlParts.host.toString()
  const updatedHost = updatedUrlParts.host.toString()

  const previousPath = previousUrlParts.path.toString()
  const updatedPath = updatedUrlParts.path.toString()

  const previousHash = previousUrlParts.hash.toString()
  const updatedHash = updatedUrlParts.hash.toString()

  return createUrl({
    host: stringHasValue(updatedHost) ? updatedHost : previousHost,
    path: stringHasValue(updatedPath) ? updatedPath : previousPath,
    query: combineUrlSearchParams(updatedQuery, previousQuery).toString(),
    hash: stringHasValue(updatedHash) ? updatedHash : previousHash,
  })
}
