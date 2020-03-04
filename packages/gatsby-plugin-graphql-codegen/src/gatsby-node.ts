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
  pluckConfig?: GraphQLTagPluckOptions
}

export interface TsOptions extends PluginOptions {
  documentPaths?: string[]
  fileName?: string
  codegen?: boolean
  codegenDelay?: number
  pluckConfig?: GraphQLTagPluckOptions
  additionalSchemas?: SchemaConfig[]
}

const defaultOptions: Required<TsOptions> = {
  plugins: [],
  documentPaths: [
    './src/**/*.{ts,tsx}',
    './.cache/fragments/*.js',
    './node_modules/gatsby-*/**/*.js',
  ],
  fileName: 'graphql-types.ts',
  codegen: true,
  codegenDelay: 200,
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

type GetOptions = (options: TsOptions) => Required<TsOptions>
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

export const onPostBootstrap: NonNullable<GatsbyNode['onPostBootstrap']> = async (
  { store, reporter },
  pluginOptions: TsOptions
) => {
  const options = getOptions(pluginOptions)
  if (!options.codegen) return

  const {
    documentPaths,
    fileName,
    codegenDelay,
    pluckConfig,
    additionalSchemas,
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
    ...additionalSchemas.map(({ schema, ...rest }) => {
      return {
        documentPaths,
        pluckConfig,
        directory,
        reporter,
        ...rest,
      }
    }),
  ]

  const formSchemaGenerators = await Promise.all(
    codegenConfigs.map(async ({ key, ...initialConfig }) => ({
      key,
      generateFromSchema: await generateWithConfig(initialConfig),
    }))
  )

  const build = async (schemas: PreparedSchemas): Promise<void> => {
    console.dir(schemas)
    try {
      for (const { key, generateFromSchema } of formSchemaGenerators) {
        const schema = schemas[key]
        if (!schema) {
          reporter.panic(
            `[gatsby-plugin-graphql-codegen] schema ${key} does not exist!`
          )
        }

        await generateFromSchema(schema)
        reporter.info(
          `[gatsby-plugin-graphql-codegen] definition for queries of schema ${key} has been updated at ${fileName}`
        )
      }
    } catch (err) {
      reporter.panic(err)
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
    await buildDebounce(await prepareSchemas(schema, additionalSchemas))
  }

  // HACKY: might break when gatsby updates
  store.subscribe(watchStore)
  await build(await prepareSchemas(schema, additionalSchemas))
}
