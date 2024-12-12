# useRouter

Returns the installed router instance. See ['Router'](/api/types/Router) for more information.

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()

router.push('profile', { userId: 123 })
```

:::tip
[Register](/quick-start.html#type-safety) your router to get the proper types when using this composable.
:::
