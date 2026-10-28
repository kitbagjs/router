# Types: AddLoaderOptions\<TName, TValue\>

```ts
type AddLoaderOptions<TName, TValue> = TransformerOptions<TValue> & object;
```

The options for a loader added via `addLoader`.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| <a id="type-parameter-tname"></a> `TName` *extends* `string` \| `undefined` | `string` | The loader's name, inferred from the `name` option. |
| <a id="type-parameter-tvalue"></a> `TValue` | `unknown` | - |

## Type Declaration

### name?

```ts
name?: TName;
```

The name of the loader, which is the key its data is exposed under on the route. Defaults to the
unnamed loader, whose data is exposed as the route's data directly.

### prefetch?

```ts
prefetch?: PrefetchConfig;
```

Determines whether this loader is run when a router-link is rendered for this route. Overrides route
level prefetch, and is itself overridden by link level prefetch.
