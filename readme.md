# Gatsby Typescript Plugin

An alternative to the official typescript plugin, with [`ts-loader`](https://github.com/TypeStrong/ts-loader) & automatic type generation for your graphql queries (using [`graphql-code-generator`](https://github.com/dotansimha/graphql-code-generator))

---
## Installation

```
yarn add typescript gatsby-plugin-ts
```

Add this to your gatsby config like any other plugins:
```js
// gatsby-config.js
module.exports = {
  plugins: [
    `gatsby-plugin-ts`,
  ]
}
```

---

Unlike the official plugin, you'd have to bring your own `tsconfig.json`.

```bash
# generate a tsconfig if you have none
tsc --init
```

In order for this plugin to work right, you'd need to set your compile options like the following:

```js
  "compilerOptions": {
    "target": "ESNext",    /* or at least ES2015 */
    "module": "ESNext",    /* or at least ES2015 */
    "lib": ["dom"],             /* <-- required! */
    "jsx": "preserve",          /* <-- required! */
    "moduleResolution": "node", /* <-- required! */
    /* other options... */
  }

```

### Options

|key | default | value |
|---|---|---|
|options.tsLoader| `{}` | option to be passed into `ts-loader`. `transpileOnly` is always `true`, since typechecking is handled by `fork-ts-checker-webpack-plugin`. [See ts-loader docs](https://github.com/TypeStrong/ts-loader#options) for more | 
|options.codegen| `true` | enable / disable generating definitions for graphql queries|
|options.fileName| `graphql-type.ts` | path to the generated file. By default, it's placed at the project root directory & it should not be placed into `src`, since this will create an infinite loop|
|options.codegenDelay| `200` | amount of delay from file change to codegen|

```js
// gatsby-config.js
{
  resolve: `gatsby-plugin-ts`,
  options: {
    tsLoader: {
      logLevel: 'warn',
    },
    fileName: `types/graphql-types.ts`,
    codegen: true,
    codegenDelay: 250,
  }
},
```

### Gatsby files

- `gatsby-config` has to be a `.js` file
- `gatsby-node` is run directly by `node`, so it has to be a .js file as well. It is a shame, because in a complicated Gatsby app it is where a lot of logic live & will benefit from ts. As a work around, it can be built with `tsc` independently, in a script in `package.json` or somehow in gatsby's pre-init hook.
- Gatsby's global variable like `__PATH_PREFIX__` can be handled by declaring this code somewhere:

```ts
// src/global.d.ts
declare const __PATH_PREFIX__: string
```

## Code generation

By default, this plugin will build typing for your queries automatically to `graphql-types.d.ts` on every edit. Please note that the definition file **should not** be placed inside `src` since this triggers a never ending loop during development.

In order to take advantage of the generated code, user needs to name their query:

```js
// src/pages/index.tsx

  export const pageQuery = graphql`
-   query {
+   query BlogIndex {
      site {
        siteMetadata {
          title
        }
      }
  ...
```

...and import it from the generated type file: 

```js
// src/pages/index.tsx

import { BlogIndexQuery } from '../graphqlTypes'

interface IBlogIndexProps {
  data: BlogIndexQuery;
  location: Location;
}

const BlogIndex: React.FC<IBlogIndexProps> = ({ data, location }) => {
  ...
}
```