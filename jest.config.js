// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const fs = require('fs')
const path = require('path')
const packages = fs.readdirSync(path.join(__dirname, './packages'))

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  // https://jestjs.io/docs/en/configuration.html#modulenamemapper-objectstring-string
  moduleNameMapper: packages
    .map(package => [
      `^${package}/(.*)$`,
      `<rootDir>/packages/${package}/src/$1`,
    ])
    .reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {}),
}
