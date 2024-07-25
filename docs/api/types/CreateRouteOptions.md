# CreateRouteOptions

```ts
type CreateRouteOptions<TRoutes>: RouteHookSuccessResponse | RouteHookPushResponse<TRoutes> | RouteHookRejectResponse | RouteHookAbortResponse;
```

CreateRouteOptions is the basic building block of a route. This type describes the object passed into `createRoute` and `createExternalRoute`. 

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TParent` *extends* [`Route`](Route) \| `undefined` | The parent route for this route. |
| `TName` *extends* `string` \| `undefined` | Optional name, will be used to create `key`. |
| `TPath` *extends* [`Path`](/api/functions/path) \| `string` \| `undefined` | The optional path part of your route. |
| `TQuery` *extends* [`Query`](/api/functions/query) \| `string` \| `undefined` | The optional query part of your route. |
| `THost` *extends* [`Host`](/api/functions/host) \| `string` \| `undefined` | The optional host part of your route. |
