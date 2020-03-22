import { GatsbyNode, PluginOptions } from 'gatsby'
import { generateWithConfig } from './graphql-codegen.config'
import debounce from 'lodash.debounce'
import { GraphQLTagPluckOptions } from '@graphql-toolkit/graphql-tag-pluck'
import { loadSchema, UnnormalizedTypeDefPointer } from '@graphql-toolkit/core'
import { UrlLoader } from '@graphql-toolkit/url-loader'
import { JsonFileLoader } from '@graphql-toolkit/json-file-loader'
import { GraphQLFileLoader } from '@graphql-toolkit/graphql-file-loader'
import { GraphQLSchema } from 'graphql'

export const DEFAULT_SCHEMA_KEY = 'default-gatsby-schema'

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
}

type GetOptions = (options: TsCodegenOptions) => Required<TsCodegenOptions>
const getOptions: GetOptions = pluginOptions => ({
  ...defaultOptions,
  ...pluginOptions,
})

type LoadAdditionalSchema = (
  schema: UnnormalizedTypeDefPointer
) => Promise<GraphQLSchema>
const loadAdditionalSchema: LoadAdditionalSchema = schema =>
  loadSchema(schema, {
    loaders: [new UrlLoader(), new JsonFileLoader(), new GraphQLFileLoader()],
  })

type PreparedSchemas = { [key: string]: GraphQLSchema }
type PrepareSchemas = (
  defaultSchema: GraphQLSchema,
  additionalSchemaConfigs: SchemaConfig[]
) => Promise<PreparedSchemas>
const prepareSchemas: PrepareSchemas = async (
  defaultSchema,
  additionalSchemaConfigs
) => {
  const additionalSchemas: PreparedSchemas = {}
  for (const config of additionalSchemaConfigs) {
    additionalSchemas[config.key] = await loadAdditionalSchema(config.schema)
  }

  return {
    [DEFAULT_SCHEMA_KEY]: defaultSchema,
    ...additionalSchemas,
  }
}

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
  } = options

  const {
    schema,
    program,
  }: { schema: GraphQLSchema; program: any } = store.getState()
  const { directory } = program

  const codegenConfigs = [
    {
      key: DEFAULT_SCHEMA_KEY,
      fileName,
      documentPaths,
      pluckConfig,
      directory,
      reporter,
    },
    ...additionalSchemas.map(({ schema, ...config }) => {
      return {
        fileName: `graphql-types-${config.key}.ts`,
        documentPaths,
        directory,
        reporter,
        ...config,
      }
    }),
  ]

  const [preparedSchemas, formSchemaGenerators] = await Promise.all([
    prepareSchemas(schema, additionalSchemas),
    asyncMap(codegenConfigs, async ({ key, ...initialConfig }) => ({
      key,
      fileName: initialConfig.fileName,
      generateFromSchema: await generateWithConfig(initialConfig),
    })),
  ])

  const build = async (schemas: PreparedSchemas): Promise<void> => {
    try {
      await asyncMap(
        formSchemaGenerators,
        async ({ key, generateFromSchema, fileName }) => {
          const schema = schemas[key]

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
    preparedSchemas[DEFAULT_SCHEMA_KEY] = schema
    await buildDebounce(preparedSchemas)
  }

  // HACKY: might break when gatsby updates
  store.subscribe(watchStore)
  await build(preparedSchemas)
}
