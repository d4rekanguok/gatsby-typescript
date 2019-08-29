import { GatsbyNode, PluginOptions } from 'gatsby'
import * as webpack from 'webpack'
import * as tsloader from 'ts-loader'
import FTCWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { generateWithConfig } from './graphql-codegen.config'
import debounce from 'lodash.debounce'

export interface TsOptions extends PluginOptions {
  tsLoader?: Partial<tsloader.Options>;
  typeCheck?: boolean;
  forkTsCheckerPlugin?: Partial<FTCWebpackPlugin.Options>;
  fileName?: string;
  codegen?: boolean;
  codegenDelay?: number;
}

const defaultOptions: TsOptions = {
  plugins: [],
  tsLoader: {},
  typeCheck: true,
  forkTsCheckerPlugin: {},
  fileName: 'graphql-types.ts',
  codegen: true,
  codegenDelay: 200,
}

type GetOptions = (options: TsOptions) => TsOptions
const getOptions: GetOptions = (pluginOptions) => ({
  ...defaultOptions,
  ...pluginOptions,
})

export const resolvableExtensions: GatsbyNode["resolvableExtensions"] = () => ['.ts', '.tsx']

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({
  loaders, actions
}, pluginOptions: TsOptions ) => {
  const options = getOptions(pluginOptions)
  const { typeCheck, forkTsCheckerPlugin } = options
  const jsLoader = loaders.js()
  if (!jsLoader) return
  const tsRule = createRule(jsLoader, options)

  const plugins: webpack.Plugin[] = []
  if (typeCheck) {
    plugins.push(new FTCWebpackPlugin(forkTsCheckerPlugin))
  }

  const config: webpack.Configuration = {
    module: {
      rules: [ tsRule ],
    },
    plugins,
  }

  actions.setWebpackConfig(config)
}

type CreateRule = (
  jsLoader: webpack.RuleSetLoader,
  options: TsOptions
  ) => webpack.RuleSetRule
const createRule: CreateRule = (jsLoader, { tsLoader }) => ({
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: [jsLoader, {
    loader: require.resolve('ts-loader'),
    options: {
      ...tsLoader,
      // use ForkTsCheckerWebpackPlugin for typecheck
      transpileOnly: true,
    }
  }],
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
      reporter.info(`[gatsby-plugin-ts] definition for queries has been updated at ${fileName}`)
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
    if (!['REPLACE_STATIC_QUERY', 'QUERY_EXTRACTED'].includes(action.type)) return
    const { schema } = store.getState()
    await buildDebounce(schema)
  }

  // HACKY: might break when gatsby updates
  store.subscribe(watchStore)
  await build(schema)
}

export const onPreInit: GatsbyNode['onPreInit'] = ({ reporter }, options: TsOptions) => {
  const { typeCheck } = getOptions(options)
  reporter.info(`[gatsby-plugin-ts] Typecheck is ${typeCheck ? 'enabled' : 'disabled'}.`)
}