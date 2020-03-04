import { GatsbyNode, PluginOptions } from 'gatsby'
import { generateWithConfig } from './graphql-codegen.config'
import debounce from 'lodash.debounce'
import { GraphQLTagPluckOptions } from '@graphql-toolkit/graphql-tag-pluck'

export interface TsCodegenOptions extends PluginOptions {
  documentPaths?: string[]
  fileName?: string
  codegen?: boolean
  codegenDelay?: number
  pluckConfig?: GraphQLTagPluckOptions
}

const defaultOptions: Required<TsCodegenOptions> = {
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
}

type GetOptions = (options: TsCodegenOptions) => Required<TsCodegenOptions>
const getOptions: GetOptions = pluginOptions => ({
  ...defaultOptions,
  ...pluginOptions,
})

export const onPostBootstrap: NonNullable<GatsbyNode['onPostBootstrap']> = async (
  { store, reporter },
  pluginOptions: TsCodegenOptions
) => {
  const options = getOptions(pluginOptions)
  if (!options.codegen) return

  const { documentPaths, fileName, codegenDelay, pluckConfig } = options

  const { schema, program } = store.getState()
  const { directory } = program
  const generateFromSchema = await generateWithConfig({
    documentPaths,
    directory,
    fileName,
    reporter,
    pluckConfig,
  })

  const build = async (schema: any): Promise<void> => {
    try {
      await generateFromSchema(schema)
      reporter.info(
        `[gatsby-plugin-graphql-codegen] definition for queries has been updated at ${fileName}`
      )
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
    await buildDebounce(schema)
  }

  // HACKY: might break when gatsby updates
  store.subscribe(watchStore)
  await build(schema)
}
