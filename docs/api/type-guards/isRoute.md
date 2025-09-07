# Type Guards: isRoute()

```ts
const isRoute: {
  (route): route is RouterRoute<Readonly<{ hash: string; href: Url; id: TRoute["id"]; matched: TRoute["matched"]; matches: TRoute["matches"]; name: TRoute["name"]; params: ExtractRouteParamTypesReading<TRoute>; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }>>;
<TRoute, TRouteName>  (route, routeName, options): route is TRoute & { name: TRouteName };
<TRoute, TRouteName>  (route, routeName, options?): route is TRoute extends RouterRoute<Readonly<{ hash: string; href: Url; id: TRoute["id"]; matched: TRoute["matched"]; matches: TRoute["matches"]; name: TRoute["name"]; params: ExtractRouteParamTypesReading<TRoute>; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }>> ? TRouteName extends TRoute<TRoute>["matches"][number]["name"] ? TRoute<TRoute> : never : never;
  (route, routeName?, options?): boolean;
};
```

A guard to verify if a route or unknown value matches a given route name.

## Call Signature

```ts
(route): route is RouterRoute<Readonly<{ hash: string; href: Url; id: TRoute["id"]; matched: TRoute["matched"]; matches: TRoute["matches"]; name: TRoute["name"]; params: ExtractRouteParamTypesReading<TRoute>; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }>>;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |

### Returns

`route is RouterRoute<Readonly<{ hash: string; href: Url; id: TRoute["id"]; matched: TRoute["matched"]; matches: TRoute["matches"]; name: TRoute["name"]; params: ExtractRouteParamTypesReading<TRoute>; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }>>`

## Call Signature

```ts
<TRoute, TRouteName>(
   route, 
   routeName, 
   options): route is TRoute & { name: TRouteName };
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `any`; `matched`: `any`; `matches`: `any`; `name`: `any`; `params`: \{ [`x`: `string`]: `unknown`; [`x`: `number`]: `unknown`; [`x`: `symbol`]: `unknown`; \}; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional`; \}\>\> |
| `TRouteName` *extends* `unknown` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `TRoute` |
| `routeName` | `TRouteName` |
| `options` | `IsRouteOptions` & `object` |

### Returns

`route is TRoute & { name: TRouteName }`

## Call Signature

```ts
<TRoute, TRouteName>(
   route, 
   routeName, 
   options?): route is TRoute extends RouterRoute<Readonly<{ hash: string; href: Url; id: TRoute["id"]; matched: TRoute["matched"]; matches: TRoute["matches"]; name: TRoute["name"]; params: ExtractRouteParamTypesReading<TRoute>; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }>> ? TRouteName extends TRoute<TRoute>["matches"][number]["name"] ? TRoute<TRoute> : never : never;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{ `hash`: `string`; `href`: [`Url`](../types/Url.md); `id`: `any`; `matched`: `any`; `matches`: `any`; `name`: `any`; `params`: \{ [`x`: `string`]: `unknown`; [`x`: `number`]: `unknown`; [`x`: `symbol`]: `unknown`; \}; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional`; \}\>\> |
| `TRouteName` *extends* `any` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `TRoute` |
| `routeName` | `TRouteName` |
| `options?` | `IsRouteOptions` |

### Returns

`route is TRoute extends RouterRoute<Readonly<{ hash: string; href: Url; id: TRoute["id"]; matched: TRoute["matched"]; matches: TRoute["matches"]; name: TRoute["name"]; params: ExtractRouteParamTypesReading<TRoute>; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }>> ? TRouteName extends TRoute<TRoute>["matches"][number]["name"] ? TRoute<TRoute> : never : never`

## Call Signature

```ts
(
   route, 
   routeName?, 
   options?): boolean;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |
| `routeName?` | `string` |
| `options?` | `IsRouteOptions` |

### Returns

`boolean`

## Param

The name of the route to check against the current route.

## Returns

True if the current route matches the given route name, false otherwise.
