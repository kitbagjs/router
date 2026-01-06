# Types: ErrorHookContext\<TRoute, TRoutes, TRejections\>

```ts
type ErrorHookContext<TRoute, TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`TRoutes`\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`TRejections`\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`TRoutes`\> |
| <a id="source"></a> `source` | `"props"` \| `"hook"` \| `"component"` |
| <a id="to"></a> `to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |
| <a id="update"></a> `update` | `RouteUpdate`\<[`ResolvedRoute`](ResolvedRoute.md)\<`TRoute`\>\> |
