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
    "target": "ES2018",    /* or at least ES2015 */
    "module": "ESNext",    /* or at least ES2015 */
    "lib": ["dom"],             /* <-- required! */
    "jsx": "preserve",          /* <-- required! */
    "moduleResolution": "node", /* <-- required! */

    /* for mixed ts/js codebase */
    "allowJS": true,
    "outDir": "./build"    /* this won't be used by ts-loader */
    /* other options... */
  }

```

### Options

|key | default | value |
|---|---|---|
|**typecheck options**|||
|options.tsLoader| `{}` | option to be passed into `ts-loader`. `transpileOnly` is always `true`, since typechecking is handled by `fork-ts-checker-webpack-plugin`. [See ts-loader docs](https://github.com/TypeStrong/ts-loader#options) for more | 
|options.alwaysCheck | `false` | <small>⚠️deprecated </small><br/> By default type checking is disabled in production mode (during `gatsby build`). Set this to `true` to enable type checking in production as well |
|options.typeCheck | `true` | Enable / disable type checking with `fork-ts-checker-webpack-plugin`. |
|options.forkTsCheckerPlugin | `{}` | Options that'll be passed to `fork-ts-checker-webpack-plugin`. For all options, please see [their docs](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#options)
|**codegen options**|||
|options.codegen| `true` | enable / disable generating definitions for graphql queries|
|options.documentPaths| <pre>['./src/&ast;&ast;/&ast;.{ts,tsx}',<br/>'./.cache/fragments/&ast;.js', <br/>'./node_modules/gatsby-&ast;/&ast;&ast;/&ast;.js']</pre> | The paths to files containing graphql queries. <br/><small>⚠️ The default paths will be overwritten by the `documentPaths` you pass in, so please make sure to include *all* necessary paths ⚠️</small>
|options.fileName| `graphql-type.ts` | path to the generated file. By default, it's placed at the project root directory & it should not be placed into `src`, since this will create an infinite loop|
|options.codegenDelay| `200` | amount of delay from file change to codegen|
|options.pluckConfig| <pre>{ globalGqlIdentifierName: "graphql", modules: [ { name: 'gatsby', identifier: 'graphql' } ] }</pre> | options passed to [graphql-tag-pluck](https://github.com/ardatan/graphql-toolkit/tree/master/packages/graphql-tag-pluck) when extracting queries and fragments from documents |
|options.failOnError (2.5.0)| `process.env.NODE_ENV === 'production'` | Throw error if the codegen fails. By default only apply to production builds.
|options.codegenConfig (^2.7.0)| `{}` | Add config directly to `graphql-codegen`. These key-value config will be applied to every `graphql-codegen` plugins. See [graphql-codegen docs on the config field](https://graphql-code-generator.com/docs/getting-started/config-field) |
|options.codegenPlugins (^2.7.0)| `[]` | Add additional plugins to `graphql-codegen`. We use the same format as Gatsby's. See example usage below.
|options.additionalSchemas (^2.6.0)| <pre>[]</pre> | array of additional schemas (other than the schema used by gatsby queries) for which types should be generated for. This is useful when you use client-side queries (e.g. with apollo-client) where you are querying another schema/endpoint |

## Example Setup

### Basic

```js
module.exports = {
  plugins: [
    `gatsby-plugin-ts`,
  ]
}
```

### Custom Output Path

```js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-ts`,
      options: {
        fileName: `gen/graphql-types.ts`,
      }
    }
  ]
}
```

### I need to change everything

```js
// gatsby-config.js
{
  resolve: `gatsby-plugin-ts`,
  options: {
    tsLoader: {
      logLevel: 'warn',
    },
    forkTsCheckerPlugin: {
      eslint: true,
    },
    fileName: `types/graphql-types.ts`,
    codegen: true,
    codegenDelay: 250,
    typeCheck: false,
    pluckConfig: {
      // this is the default config
      globalGqlIdentifierName: 'graphql',
      modules: [
        { name: 'gatsby', identifier: 'graphql' },
      ],
    },
    additionalSchemas: [
      {
        key: 'example',
        fileName: 'graphql-types-example.ts',
        schema: 'https://example.com/graphql',
        pluckConfig: {
          // config to ensure only queries using the `gql` tag are used for this schema
          globalGqlIdentifierName: 'gql',
          modules: [
            {
              name: 'graphql-tag',
              identifier: 'gql',
            },
          ],
        },
      }
    ],
  },
}
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

## Disable type checking in production

Previously this plugin disable type checking in production by default, which can be changed by setting `alwaysCheck` to `true`. Since 2.0.0 it no longer does this. If you want to preseve the previous behavior, please set the `typeCheck` option like below:

```js
{
  resolve: 'gatsby-plugin-ts',
  options: {
    // Disable type checking in production
    typeCheck: process.env.NODE_ENV !== 'production',
  }
}
```