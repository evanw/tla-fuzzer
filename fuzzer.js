import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'

import { nativeStrategy } from './strategy.native.js'
import { registryStrategy } from './strategy.registry.js'
import { rollupStrategy } from './strategy.rollup.js'
import { webpackStrategy } from './strategy.webpack.js'
import { systemJSStrategy } from './strategy.system.js'

const strategyToMatch = nativeStrategy;

const strategies = [
  registryStrategy,
  rollupStrategy,
  webpackStrategy,
  systemJSStrategy,
]

function generateTestCase({ isCyclic, useTrailingPromise }) {
  const files = {}

  for (let i = 0, count = 10; i < count; i++) {
    let isAsync = Math.random() < 0.5
    let code = ''
    if (isAsync) {
      code = `
tlaTrace('${i} before')
await 0
tlaTrace('${i} in between')
`
    } else {
      code = `
tlaTrace('${i} before')
`
    }
    if (useTrailingPromise) {
      code += `
Promise.resolve().then(() => {
  tlaTrace('${i} after')
})
`
    }
    if (i > 0) {
      const limit = isCyclic ? count : i
      if (Math.random() < 0.5) {
        let other = Math.random() * limit | 0
        code += `
import "./${other}.mjs"
`
      } else {
        let other1 = Math.random() * limit | 0
        let other2 = Math.random() * limit | 0
        code += `
import "./${other1}.mjs"
import "./${other2}.mjs"
`
      }
    }
    files[`${i}.mjs`] = code
  }

  return files
}

let currentTrace
global.tlaTrace = text => currentTrace.push(text)

async function runStrategy(strategy, files, dir) {
  const strategyDir = path.join(dir, strategy.name)
  fs.mkdirSync(strategyDir, { recursive: true })
  const js = await strategy(files, strategyDir)
  const file = path.join(dir, strategy.name + '.js')
  fs.writeFileSync(file, js)
  try {
    currentTrace = []
    await import(file)
    return currentTrace.join('\n')
  } catch (e) {
    return (e && e.stack || e) + ''
  }
}

async function main() {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const dir = path.join(__dirname, '.tests')
  try { fs.rmSync(dir, { recursive: true }) } catch (e) { }

  const variants = []
  for (const isCyclic of [false, true]) {
    for (const useTrailingPromise of [false, true]) {
      const parts = []
      if (isCyclic) parts.push('cyclic')
      if (useTrailingPromise) parts.push('trailing promise')
      variants.push({
        isCyclic,
        useTrailingPromise,
        name: parts.join(', ') || 'simple',
        counterexamples: strategies.map(() => null),
      })
    }
  }

  const totalCount = 300
  for (const variant of variants) {
    for (let i = 0; i < totalCount; i++) {
      const testDir = path.join(dir, variant.name.replace(/\W+/g, '-'), i.toString())
      fs.mkdirSync(testDir, { recursive: true })

      // V8 is assumed to be accurate (a slightly incorrect assumption)
      const files = generateTestCase(variant)
      const expectedStdout = await runStrategy(strategyToMatch, files, testDir)
      let isImportantFailure = false

      // Test how well other strategies match V8
      for (let j = 0; j < strategies.length; j++) {
        const observedStdout = await runStrategy(strategies[j], files, testDir)
        if (observedStdout !== expectedStdout) {
          if (variant.counterexamples[j]) {
            variant.counterexamples[j].count++
            continue
          }
          variant.counterexamples[j] = { files, expectedStdout, observedStdout, count: 1 }
          isImportantFailure = true
        }
      }

      // Visualize current test status
      const decorate = (name, fail) => fail
        ? `  🚫 \x1b[31m${name} (${(100 - 100 * fail.count / (i + 1)).toFixed(0)}%)\x1b[0m`
        : `  ✅ \x1b[32m${name} (100%)\x1b[0m`
      process.stdout.write(
        `\r${i + 1} run${i ? 's' : ''} (${variant.name}):` + [decorate(strategyToMatch.name, null)].concat(
          strategies.map((strategy, i) => decorate(strategy.name, variant.counterexamples[i]))).join('') + '  ')

      // Only keep this directory if it contains a counter-example
      if (!isImportantFailure) try { fs.rmSync(testDir, { recursive: true }) } catch (e) { }
    }

    process.stdout.write('\n')
  }

  // Print match statistics
  let forReadme = ''
  for (const variant of variants) {
    console.log(`\nVariant: ${variant.name}:\n`)
    forReadme += `\nVariant: ${variant.name}\n\n`

    const order = []
    for (let i = 0; i < strategies.length; i++) {
      const differentCount = variant.counterexamples[i] ? variant.counterexamples[i].count : 0
      order.push({
        differentCount,
        percent: (100 - 100 * differentCount / totalCount).toFixed(0) + '% same',
        name: strategies[i].name,
        version: strategies[i].version,
      })
    }

    // Sort by decreasing matches
    order.sort((a, b) => a.differentCount - b.differentCount || (a.text < b.text) - (a.text > b.text))

    for (const { differentCount, percent, name, version } of order) {
      if (differentCount > 0) {
        console.log(`🚫 \x1b[31m${name} (${percent})\x1b[0m`)
        forReadme += `* ${version}: 🚫 Different (${percent})\n`
      } else {
        console.log(`✅ \x1b[32m${name} (${percent})\x1b[0m`)
        forReadme += `* ${version}: ✅ Same (${percent})\n`
      }
    }
  }

  // Print information about failed strategies
  for (const variant of variants) {
    const indent = text => '  ' + text.trim().replace(/\n/g, '\n  ')
    for (let i = 0; i < strategies.length; i++) {
      const counter = variant.counterexamples[i]
      if (!counter) continue
      console.log(`\n${'='.repeat(80)}\n🚫 \x1b[31m${strategies[i].name} (${variant.name})\x1b[0m`)
      for (const name in counter.files) {
        console.log(`\n\x1b[1m[${name}]\x1b[0m\n${indent(counter.files[name])}`)
      }
      console.log(`\n\x1b[1m[Expected stdout]\x1b[0m\n${indent(counter.expectedStdout)}`)
      console.log(`\n\x1b[1m[Observed stdout]\x1b[0m\n${indent(counter.observedStdout)}`)
    }
  }

  // Update the readme
  let readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8')
  let index = readme.indexOf('## Current results\n')
  if (index !== -1) {
    readme = readme.slice(0, index)
    readme += '## Current results\n\n'
    readme += `"Same" here means that the bundled code behaves exactly the same as the unbundled code. `
    readme += `"Different" here means that the bundled code behaves differently (i.e. is evaluated in a different order) than unbundled code. `
    readme += `The same percentage means how many runs were same out of ${totalCount} total runs.\n`
    readme += `\n`
    readme += `**Note: Both the specification and V8/node currently have subtle bugs that cause undesirable behavior.** `
    readme += `So it's not really the case that matching V8/node 100% exactly is desirable. `
    readme += `But it is desirable to match V8/node at least almost exactly (~99%) as the bugs are very subtle and only affect a few edge cases. `
    readme += `Hopefully the various implementations of top-level await will converge on the same behavior in the future.\n`
    readme += forReadme
    fs.writeFileSync(path.join(__dirname, 'README.md'), readme)
  }
}

await main()
