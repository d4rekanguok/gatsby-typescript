import { GatsbyNode, PluginOptions } from 'gatsby'
import * as webpack from 'webpack'
import * as tsloader from 'ts-loader'
import FTCWebpackPlugin from 'fork-ts-checker-webpack-plugin'
// import { exec }

export interface TsOptions extends PluginOptions {
  tsLoader: tsloader.Options
}

export const resolvableExtensions: GatsbyNode["resolvableExtensions"] = () => ['.ts', '.tsx']

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({
  loaders, actions
}, pluginOptions: TsOptions ) => {
  const jsLoader = loaders.js()
  if (!jsLoader) return
  const tsRule = createRule(jsLoader, pluginOptions)
  const config: webpack.Configuration = {
    module: {
      rules: [ tsRule ],
    },
    plugins: [ new FTCWebpackPlugin() ]
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
      transpileOnly: true
    }
  }],
})