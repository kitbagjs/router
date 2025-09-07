# Variables: isRoute()

```ts
const isRoute: {
  (route): route is RouterRoute_2;
<TRoute, TRouteName>  (route, routeName, options): route is TRoute & { name: TRouteName };
<TRoute, TRouteName>  (route, routeName, options?): route is TRoute extends RouterRoute_2 ? TRouteName extends TRoute["matches"][number]["name"] ? TRoute : never : never;
  (route, routeName?, options?): boolean;
};
```

## Call Signature

```ts
(route): route is RouterRoute_2;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |

### Returns

`route is RouterRoute_2`

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
| `TRoute` *extends* `RouterRoute_2`\<`Readonly`\<\{ `hash`: `string`; `href`: `Url_2`; `id`: `any`; `matched`: `any`; `matches`: `any`; `name`: `any`; `params`: \{ [`x`: `string`]: `unknown`; [`x`: `number`]: `unknown`; [`x`: `symbol`]: `unknown`; \}; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional_2`\<`any`\>; \}\>\> |
| `TRouteName` *extends* `unknown` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `TRoute` |
| `routeName` | `TRouteName` |
| `options` | `any` |

### Returns

`route is TRoute & { name: TRouteName }`

## Call Signature

```ts
<TRoute, TRouteName>(
   route, 
   routeName, 
   options?): route is TRoute extends RouterRoute_2 ? TRouteName extends TRoute["matches"][number]["name"] ? TRoute : never : never;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* `RouterRoute_2`\<`Readonly`\<\{ `hash`: `string`; `href`: `Url_2`; `id`: `any`; `matched`: `any`; `matches`: `any`; `name`: `any`; `params`: \{ [`x`: `string`]: `unknown`; [`x`: `number`]: `unknown`; [`x`: `symbol`]: `unknown`; \}; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional_2`\<`any`\>; \}\>\> |
| `TRouteName` *extends* `RouterRoute_2`\<`Readonly`\<\{ `hash`: `string`; `href`: `Url_2`; `id`: `any`; `matched`: `any`; `matches`: `any`; `name`: `any`; `params`: \{ [`x`: `string`]: `unknown`; [`x`: `number`]: `unknown`; [`x`: `symbol`]: `unknown`; \}; `query`: `URLSearchParams`; `state`: `ExtractRouteStateParamsAsOptional_2`\<`any`\>; \}\>\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `TRoute` |
| `routeName` | `TRouteName` |
| `options?` | `any` |

### Returns

`route is TRoute extends RouterRoute_2 ? TRouteName extends TRoute["matches"][number]["name"] ? TRoute : never : never`

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
| `options?` | `any` |

### Returns

`boolean`
