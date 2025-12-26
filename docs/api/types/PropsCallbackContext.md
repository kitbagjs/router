# Types: PropsCallbackContext\<TOptions\>

```ts
type PropsCallbackContext<TOptions> = object;
```

Context provided to props callback functions

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | [`CreateRouteOptions`](CreateRouteOptions.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="parent"></a> `parent` | [`PropsCallbackParent`](PropsCallbackParent.md)\<`TOptions`\[`"parent"`\]\> |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`RouteContextToRoute`\<`ExtractRouteContext`\<`TOptions`\>\>\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`RouteContextToRejection`\<`ExtractRouteContext`\<`TOptions`\>\>\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`RouteContextToRoute`\<`ExtractRouteContext`\<`TOptions`\>\>\> |
