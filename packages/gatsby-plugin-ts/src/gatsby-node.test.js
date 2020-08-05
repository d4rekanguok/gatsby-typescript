import {
  onPreInit,
  onCreateWebpackConfig,
  resolvableExtensions,
} from './gatsby-node'

jest.mock(
  'fork-ts-checker-webpack-plugin',
  () =>
    class MockFTCWebpackPlugin {
      constructor(options) {
        this.options = options
      }
    }
)

jest.mock('./require-resolve', () => () => 'mock-resolved.ts')

describe('resolvableExtensions', () => {
  it('is .ts and .tsx', () => {
    expect(resolvableExtensions()).toMatchInlineSnapshot(`
      Array [
        ".ts",
        ".tsx",
      ]
    `)
  })
})

describe('onCreateWebpack', () => {
  it('early returns if there is no js loaders', () => {
    const mockGatsbyArgs = {
      loaders: {
        js: () => null,
      },
      actions: { setWebpackConfig: jest.fn() },
    }

    const pluginOptions = {}

    onCreateWebpackConfig(mockGatsbyArgs, pluginOptions)

    expect(mockGatsbyArgs.actions.setWebpackConfig).not.toHaveBeenCalled()
  })

  it('creates a config', () => {
    const mockGatsbyArgs = {
      loaders: {
        js: () => 'mock-js-loader',
      },
      actions: { setWebpackConfig: jest.fn() },
    }

    const pluginOptions = {
      typeCheck: true, // this is a default option, but we're being explicit
      tsLoader: { mockOptions: {} },
    }

    onCreateWebpackConfig(mockGatsbyArgs, pluginOptions)

    expect(mockGatsbyArgs.actions.setWebpackConfig).toHaveBeenCalledTimes(1)
    const config = mockGatsbyArgs.actions.setWebpackConfig.mock.calls[0][0]

    expect(config).toMatchInlineSnapshot(`
      Object {
        "module": Object {
          "rules": Array [
            Object {
              "exclude": /node_modules/,
              "test": /\\\\\\.tsx\\?\\$/,
              "use": Array [
                "mock-js-loader",
                Object {
                  "loader": "mock-resolved.ts",
                  "options": Object {
                    "mockOptions": Object {},
                    "transpileOnly": true,
                  },
                },
              ],
            },
          ],
        },
        "plugins": Array [
          MockFTCWebpackPlugin {
            "options": Object {
              "async": false,
              "formatter": "codeframe",
              "logger": Object {
                "infrastructure": "silent",
                "issues": "console",
              },
            },
          },
        ],
      }
    `)
  })
})

describe('onPreInit', () => {
  it('logs whether or not typecheck is enabled', () => {
    const mockReporter = {
      info: jest.fn(),
      warn: jest.fn(),
    }

    const pluginOptions = {
      plugins: [],
      typeCheck: true,
    }

    onPreInit({ reporter: mockReporter }, pluginOptions)

    expect(mockReporter.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "[gatsby-plugin-ts] Typecheck is enabled.",
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

  it('warns if deprecated alwaysCheck is enabled', () => {
    const mockReporter = {
      info: jest.fn(),
      warn: jest.fn(),
    }

    const pluginOptions = {
      plugins: [],
      typeCheck: false,
      alwaysCheck: true,
    }

    onPreInit({ reporter: mockReporter }, pluginOptions)

    expect(mockReporter.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "[gatsby-plugin-ts] Typecheck is disabled.",
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
    expect(mockReporter.warn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "[gatsby-plugin-ts] \`alwaysCheck\` has been deprecated. Please set \`typeCheck\` instead.",
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
})
