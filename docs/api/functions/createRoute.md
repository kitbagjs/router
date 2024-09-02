# createRoute

```ts
export function createRoute<
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithoutParent<TName, TPath, TQuery>): Route<ToName<TName>, Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  const TParent extends Route,
  const TName extends string | undefined = undefined,
  const TPath extends string | Path | undefined = undefined,
  const TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithParent<TParent, TName, TPath, TQuery>): Route<CombineName<TParent['name'], ToName<TName>>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>
```

Creates an individual route record for your router.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TParent` *extends* [`Route`](/api/types/Route) \| `undefined` | The parent route for this route. |
| `TName` *extends* `string` \| `undefined` | Optional name, will be used for routing and matching. |
| `TPath` *extends* [`Path`](/api/functions/path) \| `string` \| `undefined` | The optional path part of your route. |
| `TQuery` *extends* [`Query`](/api/functions/query) \| `string` \| `undefined` | The optional query part of your route. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `options`? | [`CreateRouteOptions`](../types/CreateRouteOptions) | Route configuration options. |

## Returns

[`Route`](../types/Route)\<`T`\>

Single Route instance.

## Example

```ts
import { createRoute } from '@kitbag/router'

const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
]

const router = createRouter(routes)
```
