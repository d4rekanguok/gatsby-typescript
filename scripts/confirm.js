const fs = require('fs')
const path = require('path')

function confirm() {
  const projectDir = path.join(process.cwd(), 'packages', 'gatsby-starter-ts')
  const generatedFile = path.join(projectDir, 'graphql-types.ts')

  fs.stat(generatedFile, err => {
    if (err) {
      console.error(`${generatedFile} doesn't exist.`)
      throw new Error(err)
    }

    console.log(`Generated: ${generatedFile}`)
  })
}

confirm()
