# Type Guards: isRoute()

## Call Signature

```ts
function isRoute(route): route is RouterRoute<Readonly<{ hash: string; href: Url; id: string; matched: CreatedRouteOptions; matches: CreatedRouteOptions[]; name: string; params: { (key: string): any; (key: number): any }; query: URLSearchParams; state: { (key: string): any; (key: number): any } }>>
```

A type guard for determining if a value is a valid RouterRoute.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `route` | `unknown` | The value to check. |

### Returns

`route is RouterRoute<Readonly<{ hash: string; href: Url; id: string; matched: CreatedRouteOptions; matches: CreatedRouteOptions[]; name: string; params: { (key: string): any; (key: number): any }; query: URLSearchParams; state: { (key: string): any; (key: number): any } }>>`

`true` if the value is a valid RouterRoute, otherwise `false`.

## Call Signature

```ts
function isRoute<TRoute, TRouteName>(
   route, 
   routeName, 
   options): route is TRoute & { name: TRouteName }
```

A type guard for determining if a value is a valid RouterRoute with an exact match.

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `string`; `matched`: [`CreatedRouteOptions`](../types/CreatedRouteOptions.md); `matches`: [`CreatedRouteOptions`](../types/CreatedRouteOptions.md)[]; `name`: `string`; `params`: \{\}; `query`: `URLSearchParams`; `state`: \{\}; \}\>\> |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `route` | `TRoute` | The value to check. |
| `routeName` | `TRouteName` | The expected route name. |
| `options` | `IsRouteOptions` & `object` | - |

### Returns

`route is TRoute & { name: TRouteName }`

`true` if the value is a valid RouterRoute with an exact match, otherwise `false`.

## Call Signature

```ts
function isRoute<TRoute, TRouteName>(
   route, 
   routeName, 
   options?): route is RouteWithMatch<TRoute, TRouteName>
```

A type guard for determining if a value is a valid RouterRoute with a partial match.

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `string`; `matched`: [`CreatedRouteOptions`](../types/CreatedRouteOptions.md); `matches`: [`CreatedRouteOptions`](../types/CreatedRouteOptions.md)[]; `name`: `string`; `params`: \{\}; `query`: `URLSearchParams`; `state`: \{\}; \}\>\> |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `route` | `TRoute` | The value to check. |
| `routeName` | `TRouteName` | The expected route name. |
| `options`? | `IsRouteOptions` | - |

### Returns

`route is RouteWithMatch<TRoute, TRouteName>`

`true` if the value is a valid RouterRoute with a partial match, otherwise `false`.

## Call Signature

```ts
function isRoute<TRouteName>(
   route, 
   routeName, 
options): route is RouterRoute<Readonly<{ hash: string; href: Url; id: any; matched: any; matches: any; name: any; params: {} | { (key: string): any; (key: number): any }; query: URLSearchParams; state: { (key: string): any; (key: number): any } }>> & { name: TRouteName }
```

A type guard for determining if a value is a valid RegisteredRouterRoute with an exact match.

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `route` | `unknown` | The value to check. |
| `routeName` | `TRouteName` | The expected route name. |
| `options` | `IsRouteOptions` & `object` | - |

### Returns

route is RouterRoute\<Readonly\<\{ hash: string; href: Url; id: any; matched: any; matches: any; name: any; params: \{\} \| \{ (key: string): any; (key: number): any \}; query: URLSearchParams; state: \{ (key: string): any; (key: number): any \} \}\>\> & \{ name: TRouteName \}

`true` if the value is a valid RegisteredRouterRoute with an exact match, otherwise `false`.

## Call Signature

```ts
function isRoute<TRouteName>(
   route, 
   routeName, 
   options?): route is TRouteName extends any ? RouterRoute<Readonly<{ hash: string; href: Url; id: any; matched: any; matches: any; name: any; params: {} | { (key: string): any; (key: number): any }; query: URLSearchParams; state: { (key: string): any; (key: number): any } }>> : never
```

A type guard for determining if a value is a valid RegisteredRouterRoute with a partial match.

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `route` | `unknown` | The value to check. |
| `routeName` | `TRouteName` | The expected route name. |
| `options`? | `IsRouteOptions` | - |

### Returns

route is TRouteName extends any ? RouterRoute\<Readonly\<\{ hash: string; href: Url; id: any; matched: any; matches: any; name: any; params: \{\} \| \{ (key: string): any; (key: number): any \}; query: URLSearchParams; state: \{ (key: string): any; (key: number): any \} \}\>\> : never

`true` if the value is a valid RegisteredRouterRoute with a partial match, otherwise `false`.

## Call Signature

```ts
function isRoute(
   route, 
   routeName?, 
   options?): boolean
```

A type guard for determining if a value is a valid RouterRoute.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `route` | `unknown` | The value to check. |
| `routeName`? | `string` | The expected route name. |
| `options`? | `IsRouteOptions` | - |

### Returns

`boolean`

`true` if the value is a valid RouterRoute, otherwise `false`.
