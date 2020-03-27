import { GatsbyNode, PluginOptions } from 'gatsby'
import { generateWithConfig } from './graphql-codegen.config'
import debounce from 'lodash.debounce'
import { GraphQLTagPluckOptions } from '@graphql-toolkit/graphql-tag-pluck'
import { loadSchema, UnnormalizedTypeDefPointer } from '@graphql-toolkit/core'
import { UrlLoader } from '@graphql-toolkit/url-loader'
import { JsonFileLoader } from '@graphql-toolkit/json-file-loader'
import { GraphQLFileLoader } from '@graphql-toolkit/graphql-file-loader'
import { GraphQLSchema } from 'graphql'

import { Types, PluginFunction } from '@graphql-codegen/plugin-helpers'

const DEFAULT_SCHEMA_KEY = 'default-gatsby-schema'

export type DEFAULT_PLUGINS = 'typescript' | 'typescript-operations'

export type CodegenPlugin = {
  resolve: DEFAULT_PLUGINS | PluginFunction
  options: Types.PluginConfig
}

export interface SchemaConfig {
  key: string
  fileName: string
  schema: UnnormalizedTypeDefPointer
  documentPaths?: string[]
  pluckConfig: GraphQLTagPluckOptions
}

export interface TsCodegenOptions extends PluginOptions {
  documentPaths?: string[]
  fileName?: string
  codegen?: boolean
  codegenDelay?: number
  pluckConfig?: GraphQLTagPluckOptions
  failOnError?: boolean
  additionalSchemas?: SchemaConfig[]
  codegenPlugins?: CodegenPlugin[]
}

const defaultOptions: Required<TsCodegenOptions> = {
  plugins: [],
  documentPaths: ['./src/**/*.{ts,tsx}', './node_modules/gatsby-*/**/*.js'],
  fileName: 'graphql-types.ts',
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
}

type GetOptions = (options: TsCodegenOptions) => Required<TsCodegenOptions>
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

export const onPostBootstrap: NonNullable<GatsbyNode['onPostBootstrap']> = async (
  { store, reporter },
  pluginOptions: TsCodegenOptions
) => {
  const options = getOptions(pluginOptions)
  if (!options.codegen) return

  const {
    documentPaths,
    fileName,
    codegenDelay,
    pluckConfig,
    additionalSchemas,
    failOnError,
    codegenPlugins,
  } = options

  const {
    schema,
    program,
  }: { schema: GraphQLSchema; program: any } = store.getState()
  const { directory } = program

  const defaultConfig = {
    key: DEFAULT_SCHEMA_KEY,
    fileName,
    documentPaths,
    pluckConfig,
    directory,
    schema,
    reporter,
  }

  const configs = [
    {
      ...defaultConfig,
      generateFromSchema: await generateWithConfig(defaultConfig),
    },
    ...(await asyncMap(additionalSchemas, async ({ schema, ...config }) => {
      const codegenConfig = {
        fileName: `graphql-types-${config.key}.ts`,
        documentPaths,
        directory,
        schema: await loadSchema(schema, {
          loaders: [
            new UrlLoader(),
            new JsonFileLoader(),
            new GraphQLFileLoader(),
          ],
        }),
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
      await asyncMap(
        configs,
        async ({ key, generateFromSchema, schema, fileName }) => {
          await generateFromSchema(schema)
          reporter.info(
            `[gatsby-plugin-graphql-codegen] definition for queries of schema ${key} has been updated at ${fileName}`
          )
        }
      )
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
