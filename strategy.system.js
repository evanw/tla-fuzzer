// This tests the evaluation order of TypeScript's SystemJS transform + SystemJS's top-level await support

import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import ts from 'typescript'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export async function systemJSStrategy(files) {
  let lastName
  let js = ''

  js += fs.readFileSync(require.resolve('systemjs/dist/system.js'), 'utf8')
  js += fs.readFileSync(require.resolve('systemjs/dist/extras/named-register.js'), 'utf8')

  for (const name in files) {
    lastName = name

    // Use TypeScript to transform the JavaScript into SystemJS format
    let code = ts.transpileModule(files[name], {
      compilerOptions: {
        module: ts.ModuleKind.System,
      },
    }).outputText

    // Use named registration since there are multiple modules in the same file
    code = code.replace(
      'System.register(',
      `System.register(${JSON.stringify('./' + name)}, `,
    )

    js += code
  }

  js += `await System.import(${JSON.stringify('./' + lastName)}, '.')\n`
  return js
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
systemJSStrategy.version = `SystemJS ${packageJSON.dependencies.systemjs}`
