# Types: RouteCallbackContext\<TRoute\>

```ts
type RouteCallbackContext<TRoute> = object;
```

Context provided to a callback attached to a route — an `addView` props getter, or a loader. Sourced
from the route: rejections/routes from the route's context, and the parent from the route's `matches`.

## Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`Route`](Route.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="parent"></a> `parent` | `RouteCallbackParent`\<`TRoute`\> |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TRoute`\[`"context"`\]\>\> |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\<`RouteContextToRejection`\<`TRoute`\[`"context"`\]\>\> |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TRoute`\[`"context"`\]\>\> |
| <a id="update"></a> `update` | `RouteUpdate`\<[`ResolvedRoute`](ResolvedRoute.md)\<`TRoute`\>\> |
