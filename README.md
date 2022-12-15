# Top-level await correctness fuzzer

This is a fuzzer to test the correctness of various [top-level await](https://github.com/tc39/proposal-top-level-await) JavaScript bundling strategies. Fuzzing is done by randomly generating module graphs and comparing the evaluation order of the bundled code with V8's native module evaluation order.

## How to run

1. Install dependencies with `npm ci`
2. Run the fuzzer with `node ./fuzzer.js`

## Current results

"Same" here means that the bundled code behaves exactly the same as the unbundled code. "Different" here means that the bundled code behaves differently (i.e. is evaluated in a different order) than unbundled code. The same percentage means how many runs were same out of 300 total runs.

**Note: Both the specification and V8/node currently have subtle bugs that cause undesirable behavior.** So it's not really the case that matching V8/node 100% exactly is desirable. But it is desirable to match V8/node at least almost exactly (~99%) as the bugs are very subtle and only affect a few edge cases. Hopefully the various implementations of top-level await will converge on the same behavior in the future.

Variant: simple

* Custom module registry algorithm: ✅ Same (100% same)
* Webpack 5.75.0: ✅ Same (100% same)
* Rollup 3.7.4: 🚫 Different (81% same)
* SystemJS 6.13.0: 🚫 Different (70% same)

Variant: trailing promise

* Custom module registry algorithm: ✅ Same (100% same)
* Webpack 5.75.0: ✅ Same (100% same)
* SystemJS 6.13.0: 🚫 Different (41% same)
* Rollup 3.7.4: 🚫 Different (15% same)

Variant: cyclic

* Webpack 5.75.0: 🚫 Different (99% same)
* Custom module registry algorithm: 🚫 Different (98% same)
* SystemJS 6.13.0: 🚫 Different (83% same)
* Rollup 3.7.4: 🚫 Different (68% same)

Variant: cyclic, trailing promise

* Custom module registry algorithm: 🚫 Different (99% same)
* Webpack 5.75.0: 🚫 Different (99% same)
* SystemJS 6.13.0: 🚫 Different (44% same)
* Rollup 3.7.4: 🚫 Different (20% same)
