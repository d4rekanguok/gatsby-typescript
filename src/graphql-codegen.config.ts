import * as fs from 'fs'
import * as path from 'path'
import { loadDocuments } from 'graphql-toolkit'
import { codegen } from '@graphql-codegen/core'
import { printSchema, parse } from 'gatsby/graphql'
import { plugin as typescriptPlugin } from '@graphql-codegen/typescript'
import { plugin as operationsPlugin } from '@graphql-codegen/typescript-operations'

interface IConfigArgs {
  directory: string;
  schema: any;
}

type CreateConfig = (args: IConfigArgs) => Promise<any>
const createConfig: CreateConfig = async ({ schema, directory }) => {
  // file name & location
  const filename = path.join(directory, 'src/graphqlTypes.ts')

  // documents
  const docPromises = [
    './src/**/*.{ts,tsx}',
    './node_modules/gatsby-*/**/*.js'
  ].map(docGlob => {
    const _docGlob = path.join(directory, docGlob)
    return loadDocuments(_docGlob)
  })
  const results = await Promise.all(docPromises)
  const documents = results.reduce((acc, cur) => acc.concat(cur), [])

  return {
    filename,
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

export const generateType = async (options: IConfigArgs) => {
  const config = await createConfig(options)
  const output = await codegen(config)
  return new Promise((resolve, reject) => {
    fs.writeFile(config.filename, output, (err) => {
        if (err) reject(err)
        resolve()
    });
  })
}