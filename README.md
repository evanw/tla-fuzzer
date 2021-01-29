# Top-level await correctness fuzzer

This is a fuzzer to test the correctness of various [top-level await](https://github.com/tc39/proposal-top-level-await) JavaScript bundling strategies. Fuzzing is done by randomly generating module graphs and comparing the evaluation order of the bundled code with V8's native module evaluation order.

## How to run

1. Install dependencies with `npm ci`
2. Run the fuzzer with `node ./fuzzer.js`

## Current results

"Correct" here means that the bundled code behaves exactly the same as the unbundled code. "Incorrect" here means that the bundled code behaves differently (i.e. is evaluated in a different order) than unbundled code. The correct percentage means how many runs were correct out of 300 total runs.

Variant: simple

* Custom module registry algorithm: ✅ Correct (100% correct)
* Webpack 5.18.0: 🚫 Incorrect (92% correct)
* Rollup 2.38.0: 🚫 Incorrect (80% correct)
* SystemJS 6.8.3: 🚫 Incorrect (67% correct)

Variant: trailing promise

* Custom module registry algorithm: ✅ Correct (100% correct)
* Webpack 5.18.0: 🚫 Incorrect (45% correct)
* SystemJS 6.8.3: 🚫 Incorrect (38% correct)
* Rollup 2.38.0: 🚫 Incorrect (12% correct)

Variant: cyclic

* Custom module registry algorithm: 🚫 Incorrect (99% correct)
* SystemJS 6.8.3: 🚫 Incorrect (84% correct)
* Webpack 5.18.0: 🚫 Incorrect (70% correct)
* Rollup 2.38.0: 🚫 Incorrect (69% correct)

Variant: cyclic, trailing promise

* Custom module registry algorithm: 🚫 Incorrect (99% correct)
* SystemJS 6.8.3: 🚫 Incorrect (46% correct)
* Webpack 5.18.0: 🚫 Incorrect (32% correct)
* Rollup 2.38.0: 🚫 Incorrect (20% correct)
