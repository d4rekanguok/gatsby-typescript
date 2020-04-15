module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [
    // typescript
    {
      files: ["*.ts", "*.tsx"],
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/member-delimiter-style': 0,
        '@typescript-eslint/interface-name-prefix': 0,
        '@typescript-eslint/no-use-before-define': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        'react/prop-types': 0,
      },
    },

    // config files
    {
      files: ["gatsby-node.js", "gatsby-config.js", "./scripts/**", "webpack.config.js"],
      env: {
        "node": true,
      }
    },

    // test files
    {
      files: ["*.test.js", "./packages/gatsby-*/__mocks__/*.js"],
      plugins: ['jest'],
      env: {
        "es6": true,
        "node": true,
        "jest/globals": true,
      },
      extends: [
        "plugin:jest/recommended"
      ],
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: "module",
      },
      rules: {
        'jest/no-focused-tests': 1,
      }
    }
  ],
  settings: {
    react: {
      version: "detect",
    }
  }
}