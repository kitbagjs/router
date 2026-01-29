# Route Scoring

When a URL matches multiple routes, the router uses an objective scoring system to determine which route is the best match. Each route receives a score between 0-100, where higher scores indicate more specific matches.

## Match Requirements

Before a route receives a score, it must pass all match rules. If any rule fails, the route receives a score of **0**.

| Rule | Description |
|------|-------------|
| Named route | Route must have a `name` property |
| Host match | If route defines a host, URL host must match the pattern |
| Path match | URL path must match the route's path pattern |
| Query match | If route defines query params, URL must contain matching values |
| Hash match | If route defines a hash, URL hash must match the pattern |
| Params valid | All required parameters must be present and pass validation |

## Score Components

| Component | Max Points | Description |
|-----------|------------|-------------|
| Base | 35 | Fixed starting point for any matching route |
| Path specificity | 35 | Based on static characters in path pattern |
| Host specificity | 10 | Based on static characters in host pattern |
| Hash specificity | 10 | Based on static characters in hash pattern |
| Query specificity | 10 | Based on static characters in query pattern |
| Optional params | -10 | Penalty based on percentage of unfilled optional params |

**Maximum score:** 100 (theoretical)
**Minimum score:** 25 (floor for any matching route)

## Specificity Calculation

Each component (path, host, hash, query) uses a logarithmic scale to calculate specificity based on static characters:

```
score = maxPoints × log(staticChars + 1) / log(MAX)
```

Where `MAX` is a component-specific constant:

| Component | Max Points | MAX constant |
|-----------|------------|--------------|
| Path | 35 | 50 |
| Host | 10 | 30 |
| Hash | 10 | 20 |
| Query | 10 | 30 |

The logarithmic scale provides diminishing returns as static characters increase, meaning the difference between 5 and 10 static characters is more significant than the difference between 45 and 50.

## Static Character Counting

Static characters are all characters in the route pattern that are not part of a parameter placeholder. Parameter syntax (`[id]`, `[?optional]`) is stripped before counting.

**Examples:**

| Route Pattern | Static Characters | Count |
|---------------|-------------------|-------|
| `/users/profile` | `/users/profile` | 14 |
| `/users/[id]` | `/users/` | 7 |
| `/users/user-[id]` | `/users/user-` | 12 |
| `/[id]` | `/` | 1 |

## Coverage Rules

When the URL contains host, hash, or query there are additional rules. (Path is always required)

| Part  | URL has | Route defines | Score                       |
|-------|---------|---------------|-----------------------------|
| Host  | ✅      | ✅            | Calculated via log formula  |
|       | ✅      | ❌            | 0 points                    |
|       | ❌      | ❌            | Full points                 |
| Hash  | ✅      | ✅            | Calculated via log formula  |
|       | ✅      | ❌            | 0 points                    |
|       | ❌      | ❌            | Full points                 |
| Query | ✅      | ✅            | Calculated via log formula  |
|       | ✅      | ❌            | 0 points                    |
|       | ❌      | ❌            | Full points                 |

## Optional Parameters

Routes with optional parameters receive a penalty based on the percentage of optional parameters that are not satisfied by the URL:

```text
penalty = 10 × (unfilledOptionalParams / totalOptionalParams)
```

This penalty is capped at 10 points and cannot reduce the score below the floor of 25.

**Examples:**

| Optional Params | Unfilled | Penalty |
|-----------------|----------|---------|
| 2 total, 1 unfilled | 50% | -5 |
| 4 total, 4 unfilled | 100% | -10 |
| 10 total, 2 unfilled | 20% | -2 |

## Scoring Examples

### Example 1: Static vs Parameterized Path

URL: `/users/123`

| Route | Path Score | Total Score |
|-------|------------|-------------|
| `/users/123` | 35 × log(11) / log(50) = 21.4 | ~86 |
| `/users/[id]` | 35 × log(8) / log(50) = 18.6 | ~84 |
| `/[id]` | 35 × log(2) / log(50) = 6.2 | ~71 |

### Example 2: URL with Hash

URL: `/users/profile#settings`

| Route | Hash Score | Total Score |
|-------|------------|-------------|
| `/users/profile` with `#settings` | 10 × log(9) / log(20) = 7.3 | ~87 |
| `/users/profile` (no hash defined) | 0 (URL has hash, route doesn't) | ~79 |

### Example 3: Comparing Multiple Routes

URL: `https://api.example.com/users/123/posts/456?sort=date#comments`

**Route A** - Most specific match:

```ts
createExternalRoute({
  host: 'https://api.example.com',
  path: '/users/[id]/posts/[postId]',
  query: 'sort=date',
  hash: '#comments',
})
```

| Component | Static Chars | Calculation | Score |
|-----------|--------------|-------------|-------|
| Base | - | - | 35.0 |
| Path | 13 (`/users/` + `/posts/`) | 35 × log(14) / log(50) | 23.6 |
| Host | 23 (`https://api.example.com`) | 10 × log(24) / log(30) | 9.3 |
| Query | 10 (`sort=date`) | 10 × log(11) / log(30) | 7.0 |
| Hash | 9 (`#comments`) | 10 × log(10) / log(20) | 7.7 |
| Optional | 0 unfilled | - | 0.0 |
| **Total** | | | **82.6** |

**Route B** - With unfilled optional param:

```ts
createExternalRoute({
  host: 'https://api.example.com',
  path: '/users/[id]/posts/[postId]',
  query: 'sort=date&limit=[?limit]',
  hash: '#comments',
})
```

| Component | Calculation | Score |
|-----------|-------------|-------|
| Base | - | 35.0 |
| Path | same as Route A | 23.6 |
| Host | same as Route A | 9.3 |
| Query | 16 static chars (`sort=date&limit=`) | 8.2 |
| Hash | same as Route A | 7.7 |
| Optional | 1/1 unfilled (URL has no `limit`) | **-10.0** |
| **Total** | | **73.8** |

**Route C** - Path only (no host/query/hash):

```ts
createRoute({
  path: '/users/[id]/posts/[postId]',
})
```

| Component | Calculation | Score |
|-----------|-------------|-------|
| Base | - | 35.0 |
| Path | same as Route A | 23.6 |
| Host | URL has host, route doesn't define | **0.0** |
| Query | URL has query, route doesn't define | **0.0** |
| Hash | URL has hash, route doesn't define | **0.0** |
| **Total** | | **58.6** |

**Summary:**

| Route | Description | Total |
|-------|-------------|-------|
| A | Full match | **82.6** |
| B | Unfilled optional param | **73.8** |
| C | Path only | **58.6** |

## Design Principles

1. **Objective scoring**: Each route's score is independent of other routes
2. **Static characters matter**: More static content in a pattern means higher specificity
3. **Params are wildcards**: Parameters match anything, so they don't contribute to specificity
4. **Unclaimed url parts penalize**: If the URL has a hash/query/host that the route doesn't define, the route is considered less specific
5. **Optional params are extra credit**: Filling optional params avoids penalty, but doesn't add bonus points
