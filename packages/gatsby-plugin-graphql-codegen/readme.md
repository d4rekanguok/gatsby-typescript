# Gatsby Typescript Graphql Codegen

Automatic type generation for your graphql queries via [`graphql-code-generator`](https://github.com/dotansimha/graphql-code-generator)


## Installation

```
yarn add typescript gatsby-plugin-graphql-codegen
```

Add this to your gatsby config like any other plugins:
```js
// gatsby-config.js
module.exports = {
  plugins: [
    `gatsby-plugin-graphql-codegen`,
  ]
}
```

### Options

|key | default | value |
|---|---|---|
|options.codegen| `true` | enable / disable generating definitions for graphql queries|
|options.documentPaths| <pre>['./src/&ast;&ast;/&ast;.{ts,tsx}',<br/>'./.cache/fragments/&ast;.js', <br/>'./node_modules/gatsby-&ast;/&ast;&ast;/&ast;.js']</pre> | The paths to files containing graphql queries. <br/><small>⚠️ The default paths will be overwritten by the `documentPaths` you pass in, so please make sure to include *all* necessary paths ⚠️</small>
|options.fileName| `graphql-type.ts` | path to the generated file. By default, it's placed at the project root directory & it should not be placed into `src`, since this will create an infinite loop|
|options.codegenDelay| `200` | amount of delay from file change to codegen|
|options.pluckConfig| <pre>{ globalGqlIdentifierName: "graphql", modules: [ { name: 'gatsby', identifier: 'graphql' } ] }</pre> | options passed to [graphql-tag-pluck](https://github.com/ardatan/graphql-toolkit/tree/master/packages/graphql-tag-pluck) when extracting queries and fragments from documents |
|options.failOnError (2.5.0)| `process.env.NODE_ENV === 'production'` | Throw error if the codegen fails. By default only apply to production builds.
|options.additionalSchemas| <pre>[]</pre> | array of additional schemas (other than the schema used by gatsby queries) for which types should be generated for. This is useful when you use client-side queries (e.g. with apollo-client) where you are querying another schema/endpoint |

#### Additional Schema Options (for `options.additionalSchemas`)
|key | default | value |
|---|---|---|
|key| - | an unique key used internally by this plugin to identify different schemas|
|fileName| graphql-types-${key}.ts | path to the generated file for this schema. By default, it's placed at the project root directory & it should not be placed into `src`, since this will create an infinite loop |
|documentPaths| value of `options.documentPaths` | The paths to files containing graphql queries.  See also `options.documentPaths` |
|pluckConfig| - | options passed to [graphql-tag-pluck](https://github.com/ardatan/graphql-toolkit/tree/master/packages/graphql-tag-pluck) when extracting queries and fragments from documents |
|schema| - | additional schema to process. Can either be an url, a path to a local schema definition (both `.json` and `.graphql` are supported) or an inline definition. See also https://github.com/ardatan/graphql-toolkit#-schema-loading |

An example setup:

```js
// gatsby-config.js
{
  resolve: `gatsby-plugin-graphql-codegen`,
  options: {
    fileName: `types/graphql-types.ts`,
    documentPaths: [
      './src/**/*.{ts,tsx}',
      './node_modules/gatsby-*/**/*.js',
    ],
    codegenDelay: 200,
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
