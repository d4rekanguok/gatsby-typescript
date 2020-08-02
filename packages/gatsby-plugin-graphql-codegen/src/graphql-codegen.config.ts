import * as fs from 'fs-extra'
import * as path from 'path'
import { Reporter } from 'gatsby'
import {
  Types,
  CodegenPlugin,
  PluginFunction,
} from '@graphql-codegen/plugin-helpers'
import { Source } from '@graphql-toolkit/common'
import { loadDocuments } from '@graphql-toolkit/core'
import { CodeFileLoader } from '@graphql-toolkit/code-file-loader'
import { codegen } from '@graphql-codegen/core'
import { printSchema, parse, GraphQLSchema } from 'gatsby/graphql'
import { plugin as typescriptPlugin } from '@graphql-codegen/typescript'
import { plugin as operationsPlugin } from '@graphql-codegen/typescript-operations'
import { GraphQLTagPluckOptions } from '@graphql-toolkit/graphql-tag-pluck'

function isSource(result: void | Source[]): result is Source[] {
  return typeof result !== 'undefined'
}

export type GatsbyCodegenPlugins = {
  resolve: 'typescript' | 'operations' | PluginFunction
  addToSchema: CodegenPlugin['addToSchema']
  validate: CodegenPlugin['validate']
  options: Record<string, any>
}

type Plugins = {
  pluginMap: Record<string, CodegenPlugin>
  plugins: Record<string, Record<string, any>>[]
}

const defaultPlugins: Plugins = {
  plugins: [
    {
      typescript: {
        skipTypename: true,
        enumsAsTypes: true,
      },
    },
    {
      operations: {
        skipTypename: true,
        exportFragmentSpreadSubTypes: true,
      },
    },
  ],
  pluginMap: {
    typescript: {
      plugin: typescriptPlugin,
    },
    operations: {
      plugin: operationsPlugin,
    },
  },
}
export const mapCodegenPlugins = ({
  codegenPlugins,
  defaultPlugins,
}: {
  codegenPlugins: GatsbyCodegenPlugins[]
  defaultPlugins: Plugins
}): Plugins =>
  codegenPlugins.reduce((acc, plugin, i) => {
    const { resolve, options, ...otherOptions } = plugin
    // handle default plugins (typescript, operations)
    if (typeof resolve === 'string') {
      const added = acc.plugins.find(
        (addedPlugin) => Object.keys(addedPlugin)[0] === resolve
      )

      if (!added) {
        throw new Error(
          `[gatsby-plugin-graphql-codegen] Invalid codegenPlugins: ${resolve}`
        )
      }

      added[resolve] = {
        ...added[resolve],
        ...options,
      }
      // presumably new plugins
    } else {
      const identifier = `codegen-plugin-${i}`
      acc.plugins.push({ [identifier]: options })
      acc.pluginMap[identifier] = { plugin: resolve, ...otherOptions }
    }
    return acc
  }, defaultPlugins)

export interface CodegenOptions {
  documentPaths: string[]
  fileName: string
  pluckConfig: GraphQLTagPluckOptions
  codegenPlugins: GatsbyCodegenPlugins[]
  codegenConfig: Record<string, any>
}

interface CreateConfigOptions extends CodegenOptions {
  directory: string
  reporter: Reporter
}

type CreateConfigFromSchema = (
  schema: GraphQLSchema
) => Promise<Types.GenerateOptions>
type CreateConfig = (
  args: CreateConfigOptions
) => Promise<CreateConfigFromSchema>
const createConfig: CreateConfig = async ({
  documentPaths,
  directory,
  fileName,
  reporter,
  pluckConfig,
  codegenPlugins,
  codegenConfig,
}) => {
  // file name & location
  const pathToFile = path.join(directory, fileName)
  const { dir } = path.parse(pathToFile)
  await fs.ensureDir(dir)

  const { pluginMap, plugins } = mapCodegenPlugins({
    codegenPlugins,
    defaultPlugins,
  })

  return async (schema): Promise<Types.GenerateOptions> => {
    // documents
    const docPromises = documentPaths.map(async (docGlob) => {
      const _docGlob = path.join(directory, docGlob)
      return loadDocuments(_docGlob, {
        pluckConfig,
        loaders: [new CodeFileLoader()],
      }).catch((err) => {
        reporter.warn('[gatsby-plugin-graphql-codegen] ' + err.message)
      })
    })
    const results = await Promise.all(docPromises)
    const documents = results
      .filter(isSource)
      .reduce((acc, cur) => acc.concat(cur), [])

    return {
      filename: pathToFile,
      schema: parse(printSchema(schema)),
      config: codegenConfig,
      documents,
      plugins,
      pluginMap,
    }
  }
}

type GenerateFromSchema = (schema: GraphQLSchema) => Promise<void>
type GenerateWithConfig = (
  initialOptions: CreateConfigOptions
) => Promise<GenerateFromSchema>
export const generateWithConfig: GenerateWithConfig = async (
  initialOptions
) => {
  const createConfigFromSchema = await createConfig(initialOptions)
  return async (schema): Promise<void> => {
    const config = await createConfigFromSchema(schema)
    const output = await codegen(config)
    return fs.writeFile(config.filename, output)
  }
}
