# Top-level await correctness fuzzer

This is a fuzzer to test the correctness of various [top-level await](https://github.com/tc39/proposal-top-level-await) JavaScript bundling strategies. Fuzzing is done by randomly generating module graphs and comparing the evaluation order of the bundled code with V8's native module evaluation order.

## How to run

1. Install dependencies with `npm ci`
2. Run the fuzzer with `node ./fuzzer.js`

## Current results

"Same" here means that the bundled code behaves exactly the same as the unbundled code. "Different" here means that the bundled code behaves differently (i.e. is evaluated in a different order) than unbundled code. The same percentage means how many runs were same out of 300 total runs.

**Note: Both the specification and V8/node currently have subtle bugs that cause undesirable behavior.** So it's not really the case that matching V8/node 100% exactly is desirable. But it is desirable to match V8/node at least almost exactly (~99%) as the bugs are very subtle and only affect a few edge cases. Hopefully the various implementations of top-level await will converge on the same behavior in the future.

Variant: simple

* Webpack 5.75.0: ✅ Same (100% same)
* Rspack 0.3.8: ✅ Same (100% same)
* Custom module registry algorithm: 🚫 Different (100% same)
* Import becomes inline await: 🚫 Different (80% same)
* Rollup 3.7.4: 🚫 Different (80% same)
* SystemJS 6.13.0: 🚫 Different (67% same)

Variant: trailing promise

* Webpack 5.75.0: ✅ Same (100% same)
* Rspack 0.3.8: ✅ Same (100% same)
* Custom module registry algorithm: 🚫 Different (99% same)
* SystemJS 6.13.0: 🚫 Different (38% same)
* Rollup 3.7.4: 🚫 Different (13% same)
* Import becomes inline await: 🚫 Different (12% same)

Variant: cyclic

* Webpack 5.75.0: 🚫 Different (100% same)
* Rspack 0.3.8: 🚫 Different (100% same)
* Custom module registry algorithm: 🚫 Different (98% same)
* SystemJS 6.13.0: 🚫 Different (80% same)
* Import becomes inline await: 🚫 Different (66% same)
* Rollup 3.7.4: 🚫 Different (66% same)

Variant: cyclic, trailing promise

* Webpack 5.75.0: 🚫 Different (99% same)
* Rspack 0.3.8: 🚫 Different (99% same)
* Custom module registry algorithm: 🚫 Different (98% same)
* SystemJS 6.13.0: 🚫 Different (44% same)
* Rollup 3.7.4: 🚫 Different (21% same)
* Import becomes inline await: 🚫 Different (19% same)
