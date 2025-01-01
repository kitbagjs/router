# Introduction

Kitbag Router introduces a fresh, developer-centric approach to routing in Vue.js applications.

At the heart of Kitbag Router lies a commitment to enhancing the developer experience.  First and foremost that means **type safety**, but also **better parameter experience**, **support for query**, **rejection handling**, simple intuitive syntax, and an extensible design written with modern Typescript.

## Show Me

[Kitbag Router: New TYPE SAFE Router for VUE
![Kitbag Router: New TYPE SAFE Router for VUE](https://img.youtube.com/vi/p1WI9hAYmJ4/0.jpg)](https://youtu.be/p1WI9hAYmJ4)

## Type Safety

You already know what routes exist, so why are we using magic strings and hoping it works out? With Kitbag Router, the routes that are available to you couldn't be clearer. If the routes change, Typescript will tell you the links that need to be updated.

## Better Route Params

Adding dynamic parameters to your route is just as easy as you'd expect but infinitely more powerful. With Kitbag Router, your parameters can be expressed as `String`, `Number`, `Boolean`, `Date`, `JSON`, `RegExp`, or literally anything else. Parameters in the route will be expected when navigating (type safety!). This param type is enforced when matching routes, so routes can be differentiated by subtle changes in param types.

## Support for Query

Defining a query on routes can control route matching, just like it does with the path. Better yet, with Kitbag Router you get the same support for params inside the query as you do the path!

## Rejection Handling

Virtually every app that needs a router will eventually need to handle URLs without a match (404), routes protected by auth (401) but the solution is on you to figure out. With Kitbag Router you have this functionality out of the box.
