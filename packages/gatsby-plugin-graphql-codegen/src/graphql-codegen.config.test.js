import * as fs from 'fs-extra'
import { buildSchema } from 'graphql'
import { loadDocuments } from '@graphql-toolkit/core'
import { generateWithConfig } from './graphql-codegen.config'

jest.mock('fs-extra', () => ({
  ensureDir: jest.fn(),
  writeFile: jest.fn(),
}))

jest.mock('@graphql-toolkit/core', () => ({
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
  expect(fs.writeFile).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          "example-directory/example-types.ts",
          "export type Maybe<T> = T | null;
    /** All built-in and custom scalars, mapped to their actual values */
    export type Scalars = {
      ID: string,
      String: string,
      Boolean: boolean,
      Int: number,
      Float: number,
    };
    
    export type Query = {
      example?: Maybe<Scalars['String']>,
    };
    
    ",
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
