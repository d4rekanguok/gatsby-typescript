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
      excludedFiles: ["*.test.js", "gatsby-node.js", "gatsby-config.js"],
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/member-delimiter-style': 0,
        '@typescript-eslint/interface-name-prefix': 0,
        '@typescript-eslint/no-use-before-define': 0,
      },
    },

    // gatsby config files
    {
      files: ["gatsby-node.js", "gatsby-config.js"],
      env: {
        "node": true,
      }
    },

    // test files
    {
      files: ["*.test.js"],
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
      }
    }
  ],
}