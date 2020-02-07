import * as fs from 'fs-extra'
import * as path from 'path'
import { Reporter } from 'gatsby'
import { Source } from '@graphql-toolkit/common'
import { loadDocuments } from '@graphql-toolkit/core'
import { CodeFileLoader } from '@graphql-toolkit/code-file-loader'
import { codegen } from '@graphql-codegen/core'
import { printSchema, parse } from 'gatsby/graphql'
import { plugin as typescriptPlugin } from '@graphql-codegen/typescript'
import { plugin as operationsPlugin } from '@graphql-codegen/typescript-operations'

function isSource(result: void | Source[]): result is Source[] {
 return typeof result !== 'undefined'
}

interface IInitialConfig {
  documentPaths: string[];
  directory: string;
  fileName: string;
  reporter: Reporter;
}

type CreateConfigFromSchema = (schema: any) => Promise<any>
type CreateConfig = (args: IInitialConfig) => Promise<CreateConfigFromSchema>
const createConfig: CreateConfig = async ({
  documentPaths,
  directory, 
  fileName, 
  reporter
}) => {
  // file name & location
  const pathToFile = path.join(directory, fileName)
  const { dir } = path.parse(pathToFile)
  await fs.ensureDir(dir)

  return async (schema) => {
    // documents
    const docPromises = documentPaths.map(async docGlob => {
      const _docGlob = path.join(directory, docGlob)
      return loadDocuments(_docGlob, {
        loaders: [new CodeFileLoader()]
      }).catch(err => {
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
      plugins: [{
        typescript: {
          skipTypename: true,
          enumsAsTypes: true,
        },
      }, {
        typescriptOperation: {
          skipTypename: true,
        },
      }],
      documents,
      pluginMap: {
        typescript: {
          plugin: typescriptPlugin
        },
        typescriptOperation: {
          plugin: operationsPlugin
        }
      }
    }
  }
}

type GenerateFromSchema = (schema: any) => Promise<void>
type GenerateWithConfig = (initialOptions: IInitialConfig) => Promise<GenerateFromSchema>
export const generateWithConfig: GenerateWithConfig = async (initialOptions) => {
  const createConfigFromSchema = await createConfig(initialOptions)
  return async (schema) => {
    const config = await createConfigFromSchema(schema)
    const output = await codegen(config)
    return fs.writeFile(config.filename, output)
  }
}
