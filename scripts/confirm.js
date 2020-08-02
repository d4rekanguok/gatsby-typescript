const fs = require('fs')
const path = require('path')

function confirm() {
  const projectDir = path.join(process.cwd(), 'packages', 'gatsby-starter-ts')
  const generatedFile = path.join(projectDir, 'graphql-types.ts')
  const generatedAdditionalFile = path.join(
    projectDir,
    'graphql-types-pokemon.ts'
  )

  for (const file of [generatedFile, generatedAdditionalFile]) {
    fs.stat(file, (err) => {
      if (err) {
        console.error(`${file} doesn't exist.`)
        throw new Error(err)
      }

      console.log(`Generated: ${file}`)
    })
  }
}

confirm()
