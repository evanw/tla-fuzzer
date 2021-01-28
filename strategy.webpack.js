// This tests the evaluation order of Webpack's experimental top-level await support

import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import webpack from 'webpack'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export async function webpackStrategy(files, dir) {
  let lastName
  for (const name in files) {
    lastName = name
    fs.writeFileSync(path.join(dir, name), files[name])
  }

  await new Promise((resolve, reject) => {
    webpack({
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
webpackStrategy.version = `Webpack ${packageJSON.dependencies.webpack}`
