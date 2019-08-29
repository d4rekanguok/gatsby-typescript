import { GatsbyNode, PluginOptions } from 'gatsby'
import { generateWithConfig } from './graphql-codegen.config'
import debounce from 'lodash.debounce'

export interface TsOptions extends PluginOptions {
  fileName?: string;
  codegen?: boolean;
  codegenDelay?: number;
}

const defaultOptions: TsOptions = {
  plugins: [],
  fileName: 'graphql-types.ts',
  codegen: true,
  codegenDelay: 200,
}

type GetOptions = (options: TsOptions) => TsOptions
const getOptions: GetOptions = (pluginOptions) => ({
  ...defaultOptions,
  ...pluginOptions,
})

export const onPostBootstrap: GatsbyNode["onPostBootstrap"] = async (
  { store, reporter }, pluginOptions: TsOptions
) => {
  const options = getOptions(pluginOptions)
  if (!options.codegen) return

  const fileName = options.fileName as string
  const codegenDelay = options.codegenDelay

  const { schema, program } = store.getState()
  const { directory } = program
  const generateFromSchema = await generateWithConfig({
    directory, fileName, reporter
  })

  const build = async (schema: any) => {
    try {
      await generateFromSchema(schema) 
      reporter.info(`[gatsby-plugin-graphql-codegen] definition for queries has been updated at ${fileName}`)
    } catch (err) {
      reporter.panic(err)
    }
  }

  const buildDebounce = debounce(build, codegenDelay, {
    trailing: true,
    leading: false,
  })

  const watchStore = async () => {
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