import { GatsbyNode } from 'gatsby'
import {
  generateWithConfig,
  GatsbyCodegenPlugins,
  CodegenOptions,
} from './graphql-codegen.config'
import debounce from 'lodash.debounce'
import { GraphQLTagPluckOptions } from '@graphql-tools/graphql-tag-pluck'
import { loadSchema, UnnormalizedTypeDefPointer } from '@graphql-tools/load'
import { UrlLoader } from '@graphql-tools/url-loader'
import { JsonFileLoader } from '@graphql-tools/json-file-loader'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { GraphQLSchema } from 'graphql'

const DEFAULT_SCHEMA_KEY = 'default-gatsby-schema'

export interface SchemaConfig {
  key: string
  fileName?: string
  schema: UnnormalizedTypeDefPointer
  documentPaths?: string[]
  pluckConfig: GraphQLTagPluckOptions
  codegenPlugins?: GatsbyCodegenPlugins[]
  codegenConfig?: Record<string, any>
}

export interface PluginOptions extends Partial<CodegenOptions> {
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
const getOptions: GetOptions = (pluginOptions) => ({
  ...defaultOptions,
  ...pluginOptions,
})

type AsyncMap = <T, TResult>(
  collection: T[],
  callback: (item: T, index: number, collection: T[]) => Promise<TResult>
) => Promise<TResult[]>
const asyncMap: AsyncMap = (collection, callback) =>
  Promise.all(collection.map(callback))

export const onPostBootstrap: GatsbyNode['onPostBootstrap'] = async (
  { store, reporter },
  pluginOptions: PluginOptions = { plugins: [] }
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
    codegenConfig,
  } = options

  const { schema, program }: { schema: GraphQLSchema; program: any } =
    store.getState()
  const { directory } = program

  const defaultConfig = {
    key: DEFAULT_SCHEMA_KEY,
    fileName,
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
      // NOTE assume err is an ErrorMeta
      if (failOnError) {
        reporter.panic(err as any)
      } else {
        reporter.warn(err as any)
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
