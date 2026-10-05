# Types: ViewTransitionProps\<TElement\>

```ts
type ViewTransitionProps<TElement> = object & Omit<ElementAttributes<NoInfer<TElement>>, "name">;
```

## Type Declaration

### as?

```ts
optional as?: TElement;
```

The element to render. Defaults to span.

### name

```ts
name: string;
```

The name shared by the outgoing and incoming elements.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* keyof `HTMLElementTagNameMap` | `"span"` |
