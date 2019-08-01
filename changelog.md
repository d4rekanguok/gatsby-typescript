# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

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