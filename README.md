# Top-level await correctness fuzzer

This is a fuzzer to test the correctness of various [top-level await](https://github.com/tc39/proposal-top-level-await) JavaScript bundling strategies. Fuzzing is done by randomly generating module graphs and comparing the evaluation order of the bundled code with V8's native module evaluation order.

## How to run

1. Install dependencies with `npm ci`
2. Run the fuzzer with `node ./fuzzer.js`

## Current results

"Correct" here means that the bundled code behaves exactly the same as the unbundled code. "Incorrect" here means that the bundled code behaves differently (i.e. is evaluated in a different order) than unbundled code.

* Custom module registry algorithm: ✅ Correct
* Rollup 2.38.0: 🚫 Incorrect
* Webpack 5.18.0: 🚫 Incorrect
* SystemJS 6.8.3: 🚫 Incorrect
