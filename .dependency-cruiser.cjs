/*
 * Module boundaries (see docs/architecture.md). `npm run boundaries` fails on any violation.
 *
 *   core/        pure TypeScript; imports nothing outside core/ (libraries like ts-fsrs are fine)
 *   languages/   language runtimes; may import core/model and core/ports only
 *   adapters/    storage, identity; may import core/model and core/ports only
 *   app/         React UI; may import core/ but never languages/ or adapters/ directly
 *   composition-root.ts and main.tsx wire everything together and may import anything
 */
module.exports = {
  forbidden: [
    {
      name: 'core-is-pure',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: '^src/(app|languages|adapters|composition-root)|react|codemirror|pyodide' },
    },
    {
      name: 'languages-use-core-contracts-only',
      severity: 'error',
      from: { path: '^src/languages/' },
      to: { path: '^src/(app|adapters|composition-root|core/engine|core/events)' },
    },
    {
      name: 'adapters-use-core-contracts-only',
      severity: 'error',
      from: { path: '^src/adapters/' },
      to: { path: '^src/(app|languages|composition-root|core/engine|core/events)' },
    },
    {
      name: 'app-depends-on-ports-not-implementations',
      severity: 'error',
      from: { path: '^src/app/' },
      to: { path: '^src/(languages|adapters|composition-root)' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    parser: 'swc',
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: { path: '\\.test\\.ts$|testFixtures' },
  },
};
