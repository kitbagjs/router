# BeforeRouteHookResponse\<TRoutes\>

```ts
type BeforeRouteHookResponse<TRoutes>: RouteHookSuccessResponse | RouteHookPushResponse<TRoutes> | RouteHookRejectResponse | RouteHookAbortResponse;
```

Type for responses from a before route hook, which may indicate different outcomes such as success, push, reject, or abort.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRoutes` *extends* [`Routes`](Routes) | The type of the routes configuration. |
