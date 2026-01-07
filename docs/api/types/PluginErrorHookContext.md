# Types: PluginErrorHookContext\<TRoutes, TRejections\>

```ts
type PluginErrorHookContext<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | [`ResolvedRoute`](ResolvedRoute.md) \| `null` |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`TRoutes`\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`TRejections`\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`TRoutes`\> |
| <a id="source"></a> `source` | `"props"` \| `"hook"` \| `"component"` |
| <a id="to"></a> `to` | [`ResolvedRoute`](ResolvedRoute.md) |
