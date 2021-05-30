import * as fs from 'fs-extra'
import * as path from 'path'
import { buildSchema } from 'graphql'
import { loadDocuments } from '@graphql-tools/load'
import { generateWithConfig, mapCodegenPlugins } from './graphql-codegen.config'

jest.mock('fs-extra', () => ({
  ensureDir: jest.fn(),
  writeFile: jest.fn(),
}))

jest.mock('@graphql-tools/load', () => ({
  loadDocuments: jest.fn(),
}))

it('takes in options and returns a function that runs codegen for the schema', async () => {
  loadDocuments.mockReturnValueOnce(Promise.resolve([]))

  const mockReporter = {
    warn: jest.fn(),
  }

  const generateFromSchema = await generateWithConfig({
    directory: './example-directory',
    documentPaths: ['./src/**/*.{ts,tsx}'],
    fileName: 'example-types.ts',
    reporter: mockReporter,
    codegenPlugins: [],
    codegenConfig: {},
  })

  const mockSchema = buildSchema(`
    type Query {
      example: String
    }
  `)

  expect(mockSchema).toMatchInlineSnapshot(`
    GraphQLSchema {
      "__allowedLegacyNames": Array [],
      "__validationErrors": undefined,
      "_directives": Array [
        "@skip",
        "@include",
        "@deprecated",
      ],
      "_implementations": Object {},
      "_mutationType": undefined,
      "_possibleTypeMap": Object {},
      "_queryType": "Query",
      "_subscriptionType": undefined,
      "_typeMap": Object {
        "Boolean": "Boolean",
        "Query": "Query",
        "String": "String",
        "__Directive": "__Directive",
        "__DirectiveLocation": "__DirectiveLocation",
        "__EnumValue": "__EnumValue",
        "__Field": "__Field",
        "__InputValue": "__InputValue",
        "__Schema": "__Schema",
        "__Type": "__Type",
        "__TypeKind": "__TypeKind",
      },
      "astNode": undefined,
      "extensionASTNodes": undefined,
      "extensions": undefined,
    }
  `)

  await generateFromSchema(mockSchema)

  expect(fs.ensureDir).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          "example-directory",
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": undefined,
        },
      ],
    }
  `)

  expect(fs.writeFile.mock.calls[0]).toBeDefined()
  expect(fs.writeFile.mock.calls[0][0]).toBe(
    path.join('example-directory', 'example-types.ts')
  )
  expect(fs.writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
    "export type Maybe<T> = T | null;
    export type Exact<T extends { [key: string]: any }> = { [K in keyof T]: T[K] };
    /** All built-in and custom scalars, mapped to their actual values */
    export type Scalars = {
      ID: string;
      String: string;
      Boolean: boolean;
      Int: number;
      Float: number;
    };

    export type Query = {
      example?: Maybe<Scalars['String']>;
    };

    "
  `)

  expect(mockReporter.warn).not.toHaveBeenCalled()
})

it('calls `reporter.warn` when `loadDocuments` rejects', async () => {
  loadDocuments.mockReturnValueOnce(Promise.reject(new Error('test error')))

  const mockReporter = {
    warn: jest.fn(),
  }

  const generateFromSchema = await generateWithConfig({
    directory: './example-directory',
    documentPaths: ['./src/**/*.{ts,tsx}'],
    fileName: 'example-types.ts',
    reporter: mockReporter,
    codegenPlugins: [],
    codegenConfig: {},
  })

  const mockSchema = buildSchema(`
    type Query {
      example: String
    }
  `)

  await generateFromSchema(mockSchema)

  expect(mockReporter.warn).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          "[gatsby-plugin-graphql-codegen] test error",
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": undefined,
        },
      ],
    }
  `)
})

describe('mapCodegenPlugins', () => {
  const fakePlugin = () => {}

  it('add new plugin', () => {
    const { pluginMap, plugins } = mapCodegenPlugins({
      codegenPlugins: [
        {
          resolve: fakePlugin,
          options: {
            hey: false,
          },
        },
      ],
      defaultPlugins: {
        pluginMap: {},
        plugins: [],
      },
    })

    const identifier = 'codegen-plugin-0'

    expect(plugins).toHaveLength(1)
    expect(plugins).toContainEqual({ [identifier]: { hey: false } })
    expect(pluginMap).toHaveProperty(identifier)
    expect(pluginMap[identifier].plugin).toBe(fakePlugin)
  })

  it('update default plugins', () => {
    const { pluginMap, plugins } = mapCodegenPlugins({
      codegenPlugins: [
        {
          resolve: 'typescript',
          options: {
            hey: false,
          },
        },
      ],
      defaultPlugins: {
        pluginMap: {
          typescript: {
            plugin: fakePlugin,
          },
        },
        plugins: [{ typescript: { hey: true } }],
      },
    })

    const identifier = 'typescript'

    expect(plugins).toHaveLength(1)
    expect(plugins).toContainEqual({ [identifier]: { hey: false } })
    expect(pluginMap).toHaveProperty(identifier)
    expect(pluginMap[identifier].plugin).toBe(fakePlugin)
  })

  it('add new plugin and update default plugin', () => {
    const { pluginMap, plugins } = mapCodegenPlugins({
      codegenPlugins: [
        {
          resolve: 'typescript',
          options: {
            hey: false,
          },
        },
        {
          resolve: fakePlugin,
          options: {
            how: 1,
          },
        },
      ],
      defaultPlugins: {
        pluginMap: {
          typescript: {
            plugin: fakePlugin,
          },
        },
        plugins: [{ typescript: { hey: true } }],
      },
    })

    expect(plugins).toHaveLength(2)
    expect(plugins).toContainEqual({ typescript: { hey: false } })
    expect(plugins).toContainEqual({ 'codegen-plugin-1': { how: 1 } })
    expect(pluginMap).toHaveProperty('typescript')
    expect(pluginMap).toHaveProperty('codegen-plugin-1')
  })
})
