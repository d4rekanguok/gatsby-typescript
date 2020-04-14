const fs = jest.genMockFromModule('fs')

fs.__mockFiles = []
fs.ensureDir = async dirPath => {
  fs.__mockFiles.push(dirPath)
}

module.exports = fs
