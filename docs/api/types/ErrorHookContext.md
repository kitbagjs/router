# Types: ErrorHookContext\<TRoutes, TRejections\>

```ts
type ErrorHookContext<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`TRoutes`\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`TRejections`\> |
| <a id="remove"></a> `remove` | [`HookRemove`](HookRemove.md) |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`TRoutes`\> |
| <a id="source"></a> `source` | `"props"` \| `"loader"` \| `"hook"` \| `"component"` |
| <a id="to"></a> `to` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
