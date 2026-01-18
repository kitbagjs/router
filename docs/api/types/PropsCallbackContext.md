# Types: PropsCallbackContext\<TRoute, TOptions\>

```ts
type PropsCallbackContext<TRoute, TOptions> = object;
```

Context provided to props callback functions

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | [`CreateRouteOptions`](CreateRouteOptions.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="parent"></a> `parent` | [`PropsCallbackParent`](PropsCallbackParent.md)\<`TOptions`\[`"parent"`\]\> |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<\[`TRoute`\] \| `ExtractRouteContextRoutes`\<`TOptions`\>\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`ExtractRouteContextRejections`\<`TOptions`\>\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<\[`TRoute`\] \| `ExtractRouteContextRoutes`\<`TOptions`\>\> |
| <a id="update"></a> `update` | `RouteUpdate`\<[`ResolvedRoute`](ResolvedRoute.md)\<`TRoute`\>\> |
