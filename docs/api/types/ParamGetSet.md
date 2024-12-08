# Types: ParamGetSet\<T\>

```ts
type ParamGetSet<T>: object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

## Type declaration

### defaultValue?

```ts
optional defaultValue: T;
```

### get

```ts
get: ParamGetter<T>;
```

### set

```ts
set: ParamSetter<T>;
```
