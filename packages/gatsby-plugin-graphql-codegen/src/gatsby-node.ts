import fs from 'fs-extra'
import path from 'path'
import { GatsbyNode } from 'gatsby'
import debounce from 'lodash.debounce'
import { GraphQLTagPluckOptions } from '@graphql-toolkit/graphql-tag-pluck'
import { loadSchema, UnnormalizedTypeDefPointer } from '@graphql-toolkit/core'
import { UrlLoader } from '@graphql-toolkit/url-loader'
import { JsonFileLoader } from '@graphql-toolkit/json-file-loader'
import { GraphQLFileLoader } from '@graphql-toolkit/graphql-file-loader'
import { GraphQLSchema } from 'graphql'

import {
  generateWithConfig,
  GatsbyCodegenPlugins,
  CodegenOptions,
} from './graphql-codegen.config'
import { isInSrc } from './utils/is-in-src'

const DEFAULT_SCHEMA_KEY = 'default-gatsby-schema'
const PLUGIN_NAME = 'gatsby-plugin-graphql-codegen'

export interface SchemaConfig {
  key: string
  fileName: string
  schema: UnnormalizedTypeDefPointer
  documentPaths?: string[]
  pluckConfig: GraphQLTagPluckOptions
  codegenPlugins?: GatsbyCodegenPlugins[]
  codegenConfig?: Record<string, any>
}

export interface PluginOptions extends Partial<CodegenOptions> {
  useModule?: boolean
  fileName?: string
  moduleName?: string
  plugins: unknown[]
  codegen?: boolean
  codegenDelay?: number
  failOnError?: boolean
  additionalSchemas?: SchemaConfig[]
}

const defaultOptions: Required<PluginOptions> = {
  plugins: [],
  documentPaths: ['./src/**/*.{ts,tsx}', './node_modules/gatsby-*/**/*.js'],
  fileName: 'graphql-types.ts',
  useModule: false,
  moduleName: 'gatsby-ts',
  codegen: true,
  codegenDelay: 200,
  failOnError: process.env.NODE_ENV === 'production',
  pluckConfig: {
    globalGqlIdentifierName: 'graphql',
    modules: [
      {
        name: 'gatsby',
        identifier: 'graphql',
      },
    ],
  },
  additionalSchemas: [],
  codegenPlugins: [],
  codegenConfig: {},
}

type GetOptions = (options: PluginOptions) => Required<PluginOptions>
const getOptions: GetOptions = pluginOptions => ({
  ...defaultOptions,
  ...pluginOptions,
})

type AsyncMap = <T, TResult>(
  collection: T[],
  callback: (item: T, index: number, collection: T[]) => Promise<TResult>
) => Promise<TResult[]>
const asyncMap: AsyncMap = (collection, callback) =>
  Promise.all(collection.map(callback))

// path to generate file, it depends on whether user use module or filename
let codegenFilename = ''

export const onPreInit: GatsbyNode['onPreInit'] = async (
  { store, reporter },
  pluginOptions = { plugins: [] }
) => {
  const { fileName, moduleName, useModule } = getOptions(pluginOptions)
  const { directory } = store.getState().program

  if (useModule) {
    // use module
    const modulePath = path.join(directory, 'node_modules', moduleName)
    codegenFilename = path.join(modulePath, 'index.d.ts')

    const modulePackageJson = path.join(modulePath, 'package.json')
    const moduleExists = await fs.pathExists(modulePackageJson)

    if (moduleExists) {
      const packageInfo = await fs.readJson(modulePackageJson)
      if (!packageInfo['_gatsby-plugin-graphql-codegen']) {
        reporter.panic(
          `${PLUGIN_NAME}: Package '${moduleName}' already exists.`
        )
      }
    } else {
      await fs.ensureDir(modulePath)
      await fs.writeFile(
        modulePackageJson,
        `
        {
          "name": "${moduleName}",
          "main": "index.js",
          "_gatsby-plugin-graphql-codegen": true
        }
      `
      )
      await fs.writeFile(path.join(modulePath, 'index.js'), `//noop`)
    }
  } else {
    // use file
    // check for src
    const srcDir = path.join(directory, 'src')
    const pathToFile = path.join(directory, fileName)
    codegenFilename = pathToFile

    const { dir } = path.parse(pathToFile)

    if (isInSrc(srcDir, dir)) {
      reporter.panic(
        `[${PLUGIN_NAME}]: \`fileName\` cannot be placed inside of \`src\`. Please check the current fileName: ${fileName}`
      )
    } else {
      await fs.ensureDir(dir)
    }
  }
}

export const onPostBootstrap: GatsbyNode['onPostBootstrap'] = async (
  { store, reporter },
  pluginOptions: PluginOptions = { plugins: [] }
) => {
  const options = getOptions(pluginOptions)
  if (!options.codegen) return

  const {
    documentPaths,
    codegenDelay,
    pluckConfig,
    additionalSchemas,
    failOnError,
    codegenPlugins,
    codegenConfig,
  } = options

  const {
    schema,
    program,
  }: { schema: GraphQLSchema; program: any } = store.getState()
  const { directory } = program

  const defaultConfig = {
    key: DEFAULT_SCHEMA_KEY,
    codegenFilename,
    documentPaths,
    pluckConfig,
    directory,
    schema,
    reporter,
    codegenPlugins,
    codegenConfig,
  }

  const configs = [
    {
      ...defaultConfig,
      generateFromSchema: await generateWithConfig(defaultConfig),
    },
    ...(await asyncMap(additionalSchemas, async ({ schema, ...config }) => {
      const codegenConfig = {
        codegenFilename: `graphql-types-${config.key}.ts`,
        documentPaths,
        directory,
        schema: await loadSchema(schema, {
          loaders: [
            new UrlLoader(),
            new JsonFileLoader(),
            new GraphQLFileLoader(),
          ],
        }),
        codegenPlugins: [],
        codegenConfig: {},
        reporter,
        ...config,
      }
      return {
        ...codegenConfig,
        generateFromSchema: await generateWithConfig(codegenConfig),
      }
    })),
  ]

  const build = async (): Promise<void> => {
    try {
      await asyncMap(configs, async ({ key, generateFromSchema, schema }) => {
        await generateFromSchema(schema)
        reporter.info(
          `[gatsby-plugin-graphql-codegen] definition for ${key} has been updated.`
        )
      })
    } catch (err) {
      if (failOnError) {
        reporter.panic(err)
      } else {
        reporter.warn(err)
      }
    }
  }

  const buildDebounce = debounce(build, codegenDelay, {
    trailing: true,
    leading: false,
  })

  const watchStore = async (): Promise<void> => {
    const { lastAction: action } = store.getState()
    if (!['REPLACE_STATIC_QUERY', 'QUERY_EXTRACTED'].includes(action.type)) {
      return
    }
    const { schema } = store.getState()
    const defaultConfig = configs.find(({ key }) => key === DEFAULT_SCHEMA_KEY)
    if (defaultConfig) {
      defaultConfig.schema = schema
    }
    await buildDebounce()
  }

  // HACKY: might break when gatsby updates
  store.subscribe(watchStore)
  await build()
}
