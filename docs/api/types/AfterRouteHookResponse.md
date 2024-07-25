# AfterRouteHookResponse

```ts
type AfterRouteHookResponse<TRoutes>: RouteHookSuccessResponse | RouteHookPushResponse<TRoutes> | RouteHookRejectResponse;
```

Type for responses from an after route hook, which may indicate different outcomes such as success, push, or reject.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRoutes` *extends* [`Routes`](Routes) | The type of the routes configuration. |
