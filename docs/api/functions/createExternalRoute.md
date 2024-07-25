# createExternalRoute

```ts
export function createExternalRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined,
  const THost extends string | Host | undefined = undefined
>(options: CreateRouteOptionsWithoutParent<TName, TPath, TQuery, THost>): Route<ToKey<TName>, ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>>

export function createExternalRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithParent<TParent, TName, TPath, TQuery, Host<'', {}>>): Route<CombineKey<TParent['key'], ToKey<TName>>, ToHost<Host<'', {}>>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>
```

Creates an individual route record for your router.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TParent` *extends* [`Route`](Route) \| `undefined` | The parent route for this route. |
| `TName` *extends* `string` \| `undefined` | Optional name, will be used to create `key`. |
| `TPath` *extends* [`Path`](/api/functions/path) \| `string` \| `undefined` | The optional path part of your route. |
| `TQuery` *extends* [`Query`](/api/functions/query) \| `string` \| `undefined` | The optional query part of your route. |
| `THost` *extends* [`Host`](/api/functions/host) \| `string` \| `undefined` | The optional host part of your route. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `options`? | [`CreateRouteOptions`](../types/CreateRouteOptions) | Route configuration options. |

## Returns

[`Route`](../types/Route)\<`T`\>

Single Route instance.

## Example

```ts
import { createExternalRoute } from '@kitbag/router'

const routerDocs = createExternalRoute({
  host: 'https://router.kitbag.dev',
  name: 'docs',
})

const routerApiDocs = createExternalRoute({
  parent: routerDocs,
  name: 'api',
  path: '/api/[topic]',
})

export const documentationRoutes = [routerDocs, routerApiDocs]
```
