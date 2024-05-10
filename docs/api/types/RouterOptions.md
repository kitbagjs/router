# RouterOptions

```ts
type RouterOptions: object & RouterRejectionComponents;
```

Options to initialize a [Router](Router) instance.

## Type declaration

### historyMode?

```ts
optional historyMode: RouterHistoryMode;
```

Specifies the history mode for the router, such as 'hash', 'history', or 'abstract'.

### initialUrl?

```ts
optional initialUrl: string;
```

Initial URL for the router to use. Required if using Node environment.

#### Default

```ts
window.location.toString()
```
