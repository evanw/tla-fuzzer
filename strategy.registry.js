// This tests the evaluation order of a module registry algorithm that matches V8's behavior

export function registryStrategy(files) {
  let js = `
    let modules = {}

    function register(name, imports, fn) {
      modules[name] = { fn, state: 'ready', imports, whenDone: [], remaining: 1 }
    }

    function evaluate(name, whenDone, stack = []) {
      let module = modules[name]
      if (module.state === 'done') {
        whenDone()
        return
      }

      module.whenDone.push(whenDone)
      if (module.state === 'busy') return
      module.state = 'busy'

      let moduleDone = () => {
        module.state = 'done'
        for (let x of module.whenDone) x()
      }
      let importDone = () => {
        if (--module.remaining !== 0) return
        let result = module.fn()
        if (result) result.then(moduleDone)
        else moduleDone()
      }

      stack = stack.concat(name)
      for (let i of module.imports) {
        if (stack.includes(i)) continue
        module.remaining++
        evaluate(i, importDone, stack)
      }
      importDone()
    }
  `
  let lastName

  for (const name in files) {
    lastName = name
    let code = files[name]
    const isAsync = /\bawait\b/.test(code)
    const imports = []
    code = code.replace(/\bimport\s*("[^"]*")/g, (stmt, path) => {
      imports.push(JSON.parse(path.replace('./', '')))
      return `/* ${stmt} */`
    })

    const args = [
      JSON.stringify(name),
      JSON.stringify(imports),
      `${isAsync ? 'async ' : ''}() => {\n${code}\n}`,
    ]
    js += `register(${args.join(', ')})\n`
  }

  js += `await new Promise(resolve => evaluate(${JSON.stringify(lastName)}, resolve))\n`
  return js
}

registryStrategy.version = `Custom module registry algorithm`
