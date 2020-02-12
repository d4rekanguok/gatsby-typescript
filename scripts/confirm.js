const fs = require('fs')
const path = require('path')

function confirm() {
  const projectDir = path.join(process.cwd(), 'packages', 'gatsby-starter-ts')
  const generatedFile = path.join(projectDir, 'graphql-types.ts')

  const doesExist = fs.stat(generatedFile, (err, stat) => {
    if (err) {
      console.error(`${generatedFile} doesn't exist.`)
      throw new Error(err)
    }

    console.log(`Generated: ${generatedFile}`)
  })
}

confirm()