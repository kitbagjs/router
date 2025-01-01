# Types: RouterPushOptions\<TState\>

```ts
type RouterPushOptions<TState> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Type declaration

### hash?

```ts
optional hash: string;
```

The hash to append to the url.

### query?

```ts
optional query: QuerySource;
```

The query string to add to the url.

### replace?

```ts
optional replace: boolean;
```

Whether to replace the current history entry.

### state?

```ts
optional state: Partial<TState>;
```

State values to pass to the route.
