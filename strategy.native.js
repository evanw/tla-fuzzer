// This tests the evaluation order of V8's actual module loader

import * as fs from 'fs'
import * as path from 'path'

export function nativeStrategy(files, dir) {
  let lastName
  for (const name in files) {
    lastName = name
    fs.writeFileSync(path.join(dir, name), files[name])
  }
  return `await import(${JSON.stringify(path.join(dir, lastName))})`
}

nativeStrategy.version = `Node ${process.version}`
