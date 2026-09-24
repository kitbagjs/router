# Types: AddLoaderOptions\<TName, TValue\>

```ts
type AddLoaderOptions<TName, TValue> = TransformerOptions<TValue> & object;
```

The options for a loader added via `addLoader`.

## Type Declaration

### name?

```ts
optional name?: TName;
```

The name of the loader, which is the key its data is exposed under on the route. Defaults to the
unnamed loader, whose data is exposed as the route's data directly.

### prefetch?

```ts
optional prefetch?: PrefetchConfig;
```

Determines whether this loader is run when a router-link is rendered for this route. Overrides route
level prefetch, and is itself overridden by link level prefetch.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TName` *extends* `string` \| `undefined` | `string` | The loader's name, inferred from the `name` option. |
| `TValue` | `unknown` | - |
