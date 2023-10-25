// This tests the evaluation order of Rspack's top-level await support since 0.3.8
// See: https://github.com/web-infra-dev/rspack/releases/tag/v0.3.8

import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { rspack } from '@rspack/core'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export async function rspackStrategy(files, dir) {
  let lastName
  for (const name in files) {
    lastName = name
    fs.writeFileSync(path.join(dir, name), files[name])
  }

  await new Promise((resolve, reject) => {
    rspack({
      entry: path.join(dir, lastName),
      mode: 'development',
      devtool: 'hidden-source-map',
      output: {
        path: path.join(dir, 'dist'),
        filename: 'out.js',
        library: 'thePromise',
      },
      experiments: {
        topLevelAwait: true,
      },
    }, (err, stats) => {
      if (err) return reject(new Error(err.toString()))
      if (stats && stats.hasErrors()) return reject(new Error(stats.toString()))
      resolve()
    })
  })

  return fs.readFileSync(path.join(dir, 'dist', 'out.js'), 'utf8') + ';\nawait thePromise'
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
rspackStrategy.version = `Rspack ${packageJSON.dependencies['@rspack/core']}`
