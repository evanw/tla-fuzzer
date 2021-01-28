// This tests the evaluation order of Rollup's experimental top-level await support

import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { rollup } from 'rollup'

export async function rollupStrategy(files, dir) {
  let lastName
  for (const name in files) {
    lastName = name
    fs.writeFileSync(path.join(dir, name), files[name])
  }

  const bundle = await rollup({ input: path.join(dir, lastName) })
  const { output } = await bundle.generate({})
  return output[0].code
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
rollupStrategy.version = `Rollup ${packageJSON.dependencies.rollup}`
