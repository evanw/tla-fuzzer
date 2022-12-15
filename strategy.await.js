// This tests the evaluation order of a simple algorithm that replaces each
// import by a hoisted inline await of a call to the module initializer

export function awaitStrategy(files) {
  // // Just caching and returning the result doesn't work. Import cycles lead to deadlocks.
  // let once = (fn) => {
  //   let first = true
  //   let result
  //   return () => {
  //     if (first) {
  //       first = false
  //       result = fn()
  //     }
  //     return result
  //   }
  // }

  let js = `
    let modules = {}

    let once = (fn) => {
      let phase = 0
      let result
      return () => {
        if (phase === 0) {
          phase++
          result = fn()
          result.then(() => phase++)
        } else if (phase === 1) {
          return // Avoid a deadlock
        }
        return result
      }
    }
  `
  let lastName

  for (const name in files) {
    lastName = name
    let code = files[name]
    let imports = ''
    code = code.replace(/\bimport\s*("[^"]*")/g, (stmt, path) => {
      path = JSON.parse(path.replace('./', ''))
      imports += `await modules[${JSON.stringify(path)}]()\n`
      return `/* ${stmt} */`
    })
    js += `modules[${JSON.stringify(name)}] = once(async () => {\n${imports}${code}\n})\n`
  }

  js += `await modules[${JSON.stringify(lastName)}]()\n`
  return js
}

awaitStrategy.version = `Import becomes inline await`
