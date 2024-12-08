# Functions: isRoute()

## Call Signature

```ts
function isRoute(route): route is RouterRoute<Readonly<{ hash?: string; id: string; matched: CreateRouteOptionsMatched<string>; matches: CreateRouteOptionsMatched<undefined | string>[]; name: string; params: { (key: string): any; (key: number): any }; query: ResolvedRouteQuery; state: { (key: string): any; (key: number): any } }>>
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |

### Returns

route is RouterRoute\<Readonly\<\{ hash?: string; id: string; matched: CreateRouteOptionsMatched\<string\>; matches: CreateRouteOptionsMatched\<undefined \| string\>\[\]; name: string; params: \{ (key: string): any; (key: number): any \}; query: ResolvedRouteQuery; state: \{ (key: string): any; (key: number): any \} \}\>\>

## Call Signature

```ts
function isRoute<TRoute, TRouteName>(
   route, 
   routeName, 
   options): route is TRoute & { name: TRouteName }
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* `RouterRoute`\<`Readonly`\<`object`\>\> |
| `TRouteName` *extends* `string` |

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
function isRoute<TRoute, TRouteName>(
   route, 
   routeName, 
options?): route is TRoute & { name: `${TRouteName}${string}` }
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* `RouterRoute`\<`Readonly`\<`object`\>\> |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `TRoute` |
| `routeName` | `TRouteName` |
| `options`? | `IsRouteOptions` |

### Returns

route is TRoute & \{ name: \`$\{TRouteName\}$\{string\}\` \}

## Call Signature

```ts
function isRoute<TRouteName>(
   route, 
   routeName, 
options): route is RouterRoute<Readonly<{ hash?: string; id: any; matched: any; matches: any; name: any; params: {} | { (key: string): any; (key: number): any }; query: ResolvedRouteQuery; state: { (key: string): any; (key: number): any } }>> & { name: TRouteName }
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |
| `routeName` | `TRouteName` |
| `options` | `IsRouteOptions` & `object` |

### Returns

route is RouterRoute\<Readonly\<\{ hash?: string; id: any; matched: any; matches: any; name: any; params: \{\} \| \{ (key: string): any; (key: number): any \}; query: ResolvedRouteQuery; state: \{ (key: string): any; (key: number): any \} \}\>\> & \{ name: TRouteName \}

## Call Signature

```ts
function isRoute<TRouteName>(
   route, 
   routeName, 
options?): route is RouterRoute<Readonly<{ hash?: string; id: any; matched: any; matches: any; name: any; params: {} | { (key: string): any; (key: number): any }; query: ResolvedRouteQuery; state: { (key: string): any; (key: number): any } }>> & { name: `${TRouteName}${string}` }
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteName` *extends* `string` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |
| `routeName` | `TRouteName` |
| `options`? | `IsRouteOptions` |

### Returns

route is RouterRoute\<Readonly\<\{ hash?: string; id: any; matched: any; matches: any; name: any; params: \{\} \| \{ (key: string): any; (key: number): any \}; query: ResolvedRouteQuery; state: \{ (key: string): any; (key: number): any \} \}\>\> & \{ name: \`$\{TRouteName\}$\{string\}\` \}

## Call Signature

```ts
function isRoute(
   route, 
   routeName?, 
   options?): boolean
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `unknown` |
| `routeName`? | `string` |
| `options`? | `IsRouteOptions` |

### Returns

`boolean`
