import path from 'path'

// check if user passed in filename is in src
type IsInSrc = (srcDir: string, fileDir: string) => boolean
export const isInSrc: IsInSrc = (srcDir, fileDir) => {
  const relativePath = path.relative(srcDir, fileDir)
  return !relativePath.startsWith('..')
}
