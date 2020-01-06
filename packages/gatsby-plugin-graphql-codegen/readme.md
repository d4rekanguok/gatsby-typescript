# Gatsby Typescript Graphql Codegen

Automatic type generation for your graphql queries via [`graphql-code-generator`](https://github.com/dotansimha/graphql-code-generator)

---
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

An example with all available settings:

```js
// gatsby-config.js
{
  resolve: `gatsby-plugin-graphql-codegen`,
  options: {
    fileName: `types/graphql-types.ts`,
    codegen: true,
    codegenDelay: 250,
  }
},
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