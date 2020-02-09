import { GatsbyNode, PluginOptions } from 'gatsby'
import * as webpack from 'webpack'
import * as tsloader from 'ts-loader'
import FTCWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { onPostBootstrap as onPostBootstrapCodegen } from '../gatsby-plugin-graphql-codegen/gatsby-node'
import requireResolve from './require-resolve';

export interface TsOptions extends PluginOptions {
  tsLoader?: Partial<tsloader.Options>;
  typeCheck?: boolean;
  alwaysCheck?: boolean;
  forkTsCheckerPlugin?: Partial<FTCWebpackPlugin.Options>;
  fileName?: string;
  codegen?: boolean;
  codegenDelay?: number;
}

const defaultOptions: TsOptions = {
  plugins: [],
  tsLoader: {},
  typeCheck: true,
  alwaysCheck: false,
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

  console.log('THIS IS RUN')

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
    loader: requireResolve('ts-loader'),
    options: {
      ...tsLoader,
      // use ForkTsCheckerWebpackPlugin for typecheck
      transpileOnly: true,
    }
  }],
})

export const onPostBootstrap = onPostBootstrapCodegen

export const onPreInit: GatsbyNode['onPreInit'] = ({ reporter }, options: TsOptions) => {
  const { alwaysCheck } = options
  const { typeCheck } = getOptions(options)
  if (typeof alwaysCheck !== 'undefined') {
    reporter.warn(`[gatsby-plugin-ts] \`alwaysCheck\` has been deprecated. Please set \`typeCheck\` instead.`)
  }
  reporter.info(`[gatsby-plugin-ts] Typecheck is ${typeCheck ? 'enabled' : 'disabled'}.`)
}