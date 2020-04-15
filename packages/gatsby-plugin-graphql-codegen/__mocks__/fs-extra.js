const fs = jest.genMockFromModule('fs')

fs.__mockFiles = []
fs.ensureDir = async dirPath => {
  fs.__mockFiles.push(dirPath)
}
fs.writeFile = async filePath => {
  fs.__mockFiles.push(filePath)
}
fs.pathExists = async filePath => {
  return fs.__mockFiles.includes(filePath)
}
fs.readJson = async () => {
  return {
    foo: 'baz',
  }
}

module.exports = fs
