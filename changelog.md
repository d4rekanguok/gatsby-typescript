# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## 2.2.0
- typecheck: Upgrade fork-ts-checker & ts-loader (#35)

## 2.1.4
- codegen: Upgrade graphql-toolkit, fix a bug caused by version mismatched (#34)

## 2.1.2
- codegen: Fix a graphql conflict error that happens in certain projects — use gatsby/graphql instead (#33)

## 2.1.0
- Allow users to modify document paths (#26)
- `gatsby-plugin-ts` now use `gatsby-plugin-graphql-codegen` under the hood instead of duplicating code

## 2.0.0
- typecheck: allow user to pass in options for [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#options)
- typecheck: #22: remove `alwaysCheck`, allow user to simply set `typeCheck` to enable / disable type checking completely. Previous behavior can be preserved by setting the following options in `gatsby-config.js`:

```js
{
  resolve: 'gatsby-plugin-ts',
  options: {
    // Disable type checking in production
    typeCheck: process.env.NODE_ENV !== 'production',
  }
}
```

## 1.3.3
- fix #15 where empty documents break build; display warning instead of throwing error
- more greenkeeping
- add `graphql-tag-pluck` as a dependency since it no longer comes with `graphql-toolkit`
- use `graphql` directly instead of going thru `gatsby/graphql`

## 1.3.2
- greenkeeping

## 1.3.1
- fix: #13, check if directory exists before writing file

## 1.3.0
- typecheck: Disable typecheck in production by default. Users can now pass in an `alwaysCheck` to enable typecheck during production (in `gatsby build`).

## 1.2.2
- codegen: actually, we only need to search for fragments in root directory's `.cache` folder

## 1.2.1
- codegen: restrict glob search for fragments in `node_modules`

## 1.1.1
- fix missing extension in default name
- fix document not being updated on file change

## 1.1.0
- codegen for graphql queries now automatically re-run during develop