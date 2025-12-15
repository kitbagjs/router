# Types: RouterErrorHookContext\<TRoutes, TRejections\>

```ts
type RouterErrorHookContext<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `string` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`TRoutes`\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`TRejections`\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`TRoutes`\> |
| <a id="source"></a> `source` | `"props"` \| `"hook"` \| `"component"` |
| <a id="to"></a> `to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |
