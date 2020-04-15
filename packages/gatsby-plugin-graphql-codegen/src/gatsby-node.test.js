import { onPreInit, onPostBootstrap } from './gatsby-node'
import { generateWithConfig } from './graphql-codegen.config'

jest.mock('./graphql-codegen.config', () => ({ generateWithConfig: jest.fn() }))

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

it('early returns if the codegen option is false', async () => {
  const mockGetState = jest.fn()
  const mockGatsbyArgs = {
    store: {
      getState: mockGetState,
    },
  }

  const pluginOptions = {
    plugins: [],
    codegen: false,
  }

  await onPostBootstrap(mockGatsbyArgs, pluginOptions)

  expect(mockGetState).not.toHaveBeenCalled()
})

describe('ensureDir onPreInit', () => {
  const fs = require('fs-extra')
  const resetMockFiles = () => {
    fs.__mockFiles = ['mock-directory/node_modules/foo/package.json']
  }
  beforeEach(resetMockFiles)
  afterEach(resetMockFiles)

  const mockStore = {
    getState: () => ({
      program: { directory: 'mock-directory' },
    }),
  }
  const mockReporter = {
    info: jest.fn(),
    panic: jest.fn(),
  }

  const mockGatsbyArgs = {
    store: mockStore,
    reporter: mockReporter,
  }

  it('creates directory for fileName onPreInit', async () => {
    const pluginOptions = {
      fileName: 'foo/bar/baz.ts',
      plugins: [],
    }

    await onPreInit(mockGatsbyArgs, pluginOptions)

    expect(fs.__mockFiles).toContain('mock-directory/foo/bar')
  })

  it('panic when fileName is built to src', async () => {
    const pluginOptions = {
      fileName: 'src/types.ts',
      plugins: [],
    }

    await onPreInit(mockGatsbyArgs, pluginOptions)

    expect(mockReporter.panic).toHaveBeenCalled()
  })

  it('build a new module when useModule is true', async () => {
    const pluginOptions = {
      useModule: true,
      moduleName: 'bar',
      plugins: [],
    }

    await onPreInit(mockGatsbyArgs, pluginOptions)
    expect(fs.__mockFiles).toContain(
      'mock-directory/node_modules/bar/package.json'
    )
  })

  it('panic when module already exists', async () => {
    const pluginOptions = {
      useModule: true,
      moduleName: 'foo',
      plugins: [],
    }

    await onPreInit(mockGatsbyArgs, pluginOptions)
    expect(mockReporter.panic).toHaveBeenCalled()
  })
})

it('calls `generateWithConfig` from `graphql-codegen.config.ts`', async () => {
  const mockGatsbyArgs = {
    store: {
      getState: () => ({
        schema: 'mock-schema',
        program: { directory: 'mock-directory' },
      }),
      subscribe: jest.fn(),
    },
    reporter: {
      info: jest.fn(),
      panic: jest.fn(),
    },
  }

  const pluginOptions = {
    documentPaths: ['./example-document-paths'],
    fileName: './example-filename.ts',
    plugins: [],
  }

  const mockGenerateFromSchema = jest.fn()
  generateWithConfig.mockReturnValueOnce(mockGenerateFromSchema)

  await onPostBootstrap(mockGatsbyArgs, pluginOptions)

  expect(generateWithConfig).toHaveBeenCalledTimes(1)
  expect(generateWithConfig.mock.calls[0][0]).toMatchInlineSnapshot(`
    Object {
      "codegenConfig": Object {},
      "codegenFilename": "mock-directory/example-filename.ts",
      "codegenPlugins": Array [],
      "directory": "mock-directory",
      "documentPaths": Array [
        "./example-document-paths",
      ],
      "key": "default-gatsby-schema",
      "pluckConfig": Object {
        "globalGqlIdentifierName": "graphql",
        "modules": Array [
          Object {
            "identifier": "graphql",
            "name": "gatsby",
          },
        ],
      },
      "reporter": Object {
        "info": [MockFunction] {
          "calls": Array [
            Array [
              "[gatsby-plugin-graphql-codegen] definition for default-gatsby-schema has been updated.",
            ],
          ],
          "results": Array [
            Object {
              "type": "return",
              "value": undefined,
            },
          ],
        },
        "panic": [MockFunction],
      },
      "schema": "mock-schema",
    }
  `)

  expect(mockGenerateFromSchema).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "mock-schema",
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

it('calls `reporter.warn` if `generateWithConfig` throws', async () => {
  const mockGatsbyArgs = {
    store: {
      getState: () => ({
        schema: 'mock-schema',
        program: { directory: 'mock-directory' },
      }),
      subscribe: jest.fn(),
    },
    reporter: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  }

  const pluginOptions = {
    documentPaths: ['./example-document-paths'],
    fileName: './example-filename.ts',
    plugins: [],
  }

  const mockGenerateFromSchema = () => {
    throw new Error('mock error')
  }
  generateWithConfig.mockReturnValueOnce(mockGenerateFromSchema)

  await onPostBootstrap(mockGatsbyArgs, pluginOptions)

  expect(mockGatsbyArgs.reporter.warn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            [Error: mock error],
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

it('subscribes to the store and debounces the `build` function', async () => {
  // this variable is assigned when the `.subscribe` function is called.
  // it allows us to invoke the listener and mock "notify" its state
  let notify

  const codegenDelay = 50

  const mockState = {
    schema: 'mock-schema',
    program: { directory: 'mock-directory' },
    // this type has to be either `QUERY_EXTRACTED` or `REPLACE_STATIC_QUERY`
    lastAction: { type: 'QUERY_EXTRACTED' },
  }

  const mockGatsbyArgs = {
    store: {
      getState: () => mockState,
      subscribe: listener => {
        notify = listener
      },
    },
    reporter: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  }

  const pluginOptions = {
    documentPaths: ['./example-document-paths'],
    fileName: './example-filename.ts',
    codegenDelay,
    plugins: [],
  }

  const mockGenerateFromSchema = jest.fn()
  generateWithConfig.mockReturnValue(mockGenerateFromSchema)

  await onPostBootstrap(mockGatsbyArgs, pluginOptions)
  expect(mockGenerateFromSchema).toHaveBeenCalledTimes(1)

  // notify the subscriber 5 times
  for (let i = 0; i < 5; i += 1) {
    notify()
  }

  // wait 2x the amount of the codegen delay to ensure everything has flushed
  await delay(codegenDelay * 2)
  // because of the debounce, we should expect it to have only been called
  // twice instead of 6 times
  expect(mockGenerateFromSchema).toHaveBeenCalledTimes(2)

  expect(mockGatsbyArgs.reporter.info).toHaveBeenCalled()
  expect(mockGatsbyArgs.reporter.warn).not.toHaveBeenCalled()
})

it("doesn't call build if the `lastAction.type` isn't 'REPLACE_STATIC_QUERY' or 'QUERY_EXTRACTED'", async () => {
  // this variable is assigned when the `.subscribe` function is called.
  // it allows us to invoke the listener and mock "notify" its state
  let notify

  const codegenDelay = 50

  const mockState = {
    schema: 'mock-schema',
    program: { directory: 'mock-directory' },
    lastAction: { type: 'NOT_THE_CORRECT_ACTION' },
  }

  const mockGatsbyArgs = {
    store: {
      getState: () => mockState,
      subscribe: listener => {
        notify = listener
      },
    },
    reporter: {
      info: jest.fn(),
      panic: jest.fn(),
    },
  }

  const pluginOptions = {
    documentPaths: ['./example-document-paths'],
    fileName: './example-filename.ts',
    codegenDelay,
    plugins: [],
  }

  const mockGenerateFromSchema = jest.fn()
  generateWithConfig.mockReturnValue(mockGenerateFromSchema)

  await onPostBootstrap(mockGatsbyArgs, pluginOptions)
  expect(mockGenerateFromSchema).toHaveBeenCalledTimes(1)

  // notify the subscriber 5 times
  for (let i = 0; i < 5; i += 1) {
    notify()
  }

  // wait 2x the amount of the codegen delay to ensure everything has flushed
  await delay(codegenDelay * 2)
  // because the lastAction.type above isn't the 'REPLACE_STATIC_QUERY' or
  // 'QUERY_EXTRACTED', this will only be called once
  expect(mockGenerateFromSchema).toHaveBeenCalledTimes(1)
})
