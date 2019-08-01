import * as fs from 'fs-extra'
import * as path from 'path'
import { loadDocuments } from 'graphql-toolkit'
import { codegen } from '@graphql-codegen/core'
import { printSchema, parse } from 'gatsby/graphql'
import { plugin as typescriptPlugin } from '@graphql-codegen/typescript'
import { plugin as operationsPlugin } from '@graphql-codegen/typescript-operations'

interface IInitialConfig {
  directory: string;
  fileName: string;
}

type CreateConfigFromSchema = (schema: any) => Promise<any>
type CreateConfig = (args: IInitialConfig) => Promise<CreateConfigFromSchema>
const createConfig: CreateConfig = async ({ directory, fileName }) => {
  // file name & location
  const pathToFile = path.join(directory, fileName)
  const { dir } = path.parse(pathToFile)
  await fs.ensureDir(dir)

  return async (schema) => {
    // documents
    const docPromises = [
      './src/**/*.{ts,tsx}',
      './.cache/fragments/*.js',
    ].map(async docGlob => {
      const _docGlob = path.join(directory, docGlob)
      return loadDocuments(_docGlob).catch(err => {
        console.log('catched')
        console.log(err)
      })
    })
    const results = await Promise.all(docPromises)
    const documents = results.reduce((acc, cur) => {
      if (!cur) return acc
      // @ts-ignore
      return acc.concat(cur)
    }, [])

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
type GenerateWithConfig = (initalOptions: IInitialConfig) => Promise<GenerateFromSchema>
export const generateWithConfig: GenerateWithConfig = async (initalOptions) => {
  const createConfigFromSchema = await createConfig(initalOptions)
  return async (schema) => {
    const config = await createConfigFromSchema(schema)
    const output = await codegen(config)
    return fs.writeFile(config.filename, output)
  }
}