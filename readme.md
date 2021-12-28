# Gatsby Typescript

An alternative to the official typescript plugin, with [`ts-loader`](https://github.com/TypeStrong/ts-loader) & automatic type generation for your graphql queries (using [`graphql-code-generator`](https://github.com/dotansimha/graphql-code-generator))

---

> Hi there 👋 
> Are you just looking for a way to generate graphql types for your graphql queries?
>
> `gatsby-plugin-graphql-codegen` is what you want. However, other maintainers and I haven't been able to keep this repo up to shape. Please have a look at @cometkim's [graphql-plugin-typegen](https://github.com/cometkim/gatsby-plugin-typegen) which does almost the same thing & better maintained.
> Still, ideas & PRs are all welcomed. If you'd like to help maintain this project, please feel free to reach out. Thank you, have a great day!

---


This monorepo houses 2 packages:

| npm package | Description | Docs |
|---|---|---|
| gatsby-plugin-ts | alternative typescript support with `ts-loader` & automated graphql codegen via `graphql-code-generator` | [`docs`](./packages/gatsby-plugin-ts/readme.md)
| gatsby-plugin-graphql-codegen | automated graphql codegen via `graphql-code-generator` | [`docs`](./packages/gatsby-plugin-graphql-codegen/readme.md)

---

Quick links: [Acknowledgement](https://github.com/d4rekanguok/gatsby-typescript#acknowledgment) • [General Q&A](https://github.com/d4rekanguok/gatsby-typescript#general-qa) • [Contribute](https://github.com/d4rekanguok/gatsby-typescript#contribute-to-this-repo)

---

## Acknowledgment

Special thanks to the contributors, who have improved this project with code, bug reports & suggestions:

### Code

[@ricokahler (maintainer)](https://github.com/ricokahler),

[@kije](https://github.com/kije),

[@Js-Brecht](https://github.com/Js-Brecht), 

[@Kerumen](https://github.com/Kerumen), 

[@olee](https://github.com/olee),

[@Tielem](https://github.com/Tielem)

### Bugs & Suggestions

[@frantic1048](https://github.com/frantic1048), 

[@cometkim](https://github.com/cometkim), 

[@FrobtheBuilder](https://github.com/FrobtheBuilder), 

[@aswinckr](https://github.com/aswinckr), 

[@mshick](https://github.com/mshick), 

[@joewood](https://github.com/joewood),

[@Jdruwe](https://github.com/Jdruwe)

<small>

Do you want to send a PR? [see this section](https://github.com/d4rekanguok/gatsby-typescript#contribute-to-this-repo)

</small>

### Powered By

This project is built upon these awesome projects:

- TypeStrong projects: 
  - [TS Loader](https://github.com/TypeStrong/ts-loader)
  - [Fork TS Checker Webpack Plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)

- [The Guild](https://the-guild.dev/)'s projects:
  - [Graphql Code Generator](https://github.com/dotansimha/graphql-code-generator)
  - [Graphql Toolkit](https://github.com/ardatan/graphql-toolkit)

And of course, [Gatsbyjs](https://github.com/gatsbyjs/gatsby) and [Typescript](https://github.com/microsoft/typescript)

---

## General Q&A

Here's a list of common questions I've seen since releasing this project. If you have a question that's not here, please don't hesitate to open an issue!

<details>
  <summary><strong>
  Why use <code>gatsby-plugin-ts</code>?
  </strong></summary>

  Gatsby use `babel-preset-typescript` which strips type information out of your code without doing typecheck. `gatsby-plugin-ts` use `ts-loader`, so you don't have to (1) worry about the [caveats](https://babeljs.io/docs/en/babel-plugin-transform-typescript#caveats) of `babel-preset-typescript` or (2) use an IDE / code editor that can typecheck for you.

  It also generate typings for your graphql queries, make it easier to strengthen your code.

  If you're already using something like VSCode and/or don't want to do typecheck in production, you can toggle off the typecheck option.
</details>

<details>
  <summary><strong>
  What's the difference between <code>gatsby-plugin-ts</code> and <code>gatsby-plugin-graphql-codegen</code>?
  </strong></summary>

  Originally belong to the same plugin, the codegen portion was extracted to `gatsby-plugin-graphql-codegen` so it can be used with the official typescript plugin. If you are already using `gatsby-plugin-ts`, you don't need `gatsby-plugin-graphql-codegen`.
</details>

<details>
  <summary><strong>
  Should I check the generated type definition into git?
  </strong></summary>

  It's up to your preference.
</details>

<details>
  <summary><strong>
  What is up with all the <code>Maybe&lt;T&gt;</code>?
  </strong></summary>

  It's due to Gatsby internal. There's an effort to [make typing more strict here](https://github.com/gatsbyjs/gatsby/issues/20069).

  You also may find the new optional chaining & nullish coalescing operator in typescript 3.7 helpful to deal with this.
</details>

<details>
  <summary><strong>
  Can I turn off type checking and/or type generating?
  </strong></summary>

  Yes! You can also use node env to determine whether to enable these features.

  ```js
  // gatsby-config.js
  {
    resolve: `gatsby-plugin-ts`,
    options: {
      codegen: false,
      typeCheck: process.env.NODE_ENV === 'development',
    }
  },
  ```



</details>

<details>
  <summary><strong>
  My graphql queries returns <code>null</code>
  </strong></summary>

  Gatsby extract graphql queries statically and it only understand queries inside template literal. It's possible that tsc is transpiling your template literal to string concat quivalent. Check your `tsconfig.json` & make sure you have a setting similar to this:

  ```js
  "compilerOptions": {
    "target": "ES2018",    /* or at least ES2015 */
    "module": "ESNext",    /* or at least ES2015 */
    "lib": ["dom"],             /* <-- required! */
    "jsx": "preserve",          /* <-- required! */
    "moduleResolution": "node", /* <-- required! */
    /* other options... */
  }
  ```

</details>

<details>
  <summary><strong>
  What if I have a mixed ts/js codebase?
  </strong></summary>

  You'd have to update your `tsconfig` with the below options:

  ```json
    "allowJs": true,
    "outDir": "./build"
  ```

  The `outDir` option won't be used by ts-loader, but you may need it to satisfy vscode.

</details>

<details>
  <summary><strong>
  Babel doesn't understand the new optional chaining & nullish coalescing syntax even though my IDE shows no errors
  </strong></summary>

  If you are using `gatsby-plugin-ts`, before you go off and install a bunch of babel plugins like a lot of tutorials suggest, check if your compilation `target` in `tsconfig.json` is too high (`ESNext` or `ES2019`).
  
  With these targets, tsc will leave the new syntax as-is, which babel might not understand. Downgrade them to `ES2018` should fix the issue; also make sure _your_ IDE's typescript version is the same as the one listed in your `package.json` dependency.

</details>

<details>
  <summary><strong>
  Can I write `gatsby-node` in typescript & have its queries typing generated as well?
  </strong></summary>

  Yes, but it's not easy at the moment. We're working on it; stay tuned!

</details>

<details>
  <summary><strong>
  Typechecking causes `gatsby develop` to crash.
  </strong></summary>

  We're trying to pin down why this happens, please share your experience in [#36](https://github.com/d4rekanguok/gatsby-typescript/issues/36)

</details>

### Common warning & errors
Gatsby recently moved plugins' fragments from `.cache` to `node_modules`. We currently support both paths, but sometimes it may cause conflict warnings & errors:

<details>
  <summary><strong>
  `warning: Unable to find any GraphQL type definitions for the following pointers ...`
  </strong></summary>
  
  If you are annoyed by this warning, set the `documentPaths` options as below:

  ```js
  // gatsby-config.js
  {
    resolve: 'gatsby-plugin-graphql-codegen',
    options: {
      documentPaths: [
        './src/**/*.{ts,tsx}',
        './node_modules/gatsby-*/**/*.js',
      ],
    }
  },
  ```

  ~~We will remove the `.cache/fragments` path and bump gatsby peer dependency version in a later release.~~

  **Update**: Since 2.4.0, we've removed `.cache/fragments` & bump up gatsby peer dep.
  
</details>

<details>
  <summary><strong>
  Duplicate identifier error: <code>Duplicate identifier 'GatsbyImageSharpFixedFragment'</code>
  </strong></summary>

  If you see this error please run a `gatsby clean` to remove fragments in `.cache`, or set the `documentPaths` options as below:

  ```js
  // gatsby-config.js
  {
    resolve: 'gatsby-plugin-graphql-codegen',
    options: {
      documentPaths: [
        './src/**/*.{ts,tsx}',
        './node_modules/gatsby-*/**/*.js',
      ],
    }
  },
  ```
</details>

<details>
  <summary><strong>
  Missing definition <code>Unknown identifier 'GatsbyImageSharpFixedFragment'</code> in a yarn/lerna monorepo
  </strong></summary>

  Are you using a monorepo? It's possible that the missing fragment's plugin is 'hoisted' (moved to workspace root's `node_modules`). A simple fix is use a `nohoist` config, supported by both lerna & yarn. Here's an example with yarn workspace, where `gatsby-transformer-sharp` is always installed in its project's `node_modules`.

  in your root's `package.json`
  ```json
  "workspaces": {
    "packages": ["packages/*"],
    "nohoist": [
      "**/gatsby-transformer-sharp"
    ]
  }
  ```

</details>

## Contribute to this repo

All PRs / issues are welcomed.

Steps to run in development:

```bash
# 0
git clone https://github.com/d4rekanguok/gatsby-typescript.git && cd gatsby-typescript

# 1 Install deps
yarn

# 2 Hook up dependencies
yarn bootstrap

# 3 Build binaries
lerna run build

# 4 Run test
yarn test
```

You can test your code against the starters inside the repo. Don't forget to checkout the changes in those repo before sending a PR. Alternatively, use [yalc](https://github.com/whitecolor/yalc) to test the plugins in your own Gatsby project:

```bash
# 1 Install yalc
npm i yalc -G

# 2 cd into, say, gatsby-plugin-ts
cd packages/gatsby-plugin-ts

# 3 Publish to yalc
yalc publish

# 4 cd into your gatsby project
cd ../../my-gatsby-project

# 5 Install yalc & re-install deps
npm uninstall gatsby-plugin-ts && yalc add gatsby-plugin-ts

npm install

# 6 Subsequent update
yalc update

# 7 Done? remove yalc deps
yalc remove --all
```
