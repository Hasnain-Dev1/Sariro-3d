import reactHooks from 'eslint-plugin-react-hooks';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * SARIRO — the one lint rule that must never be off
 * =========================================================
 * `npm run lint` does not run in this repo, and has not for a long time. Two
 * separate breakages are stacked on top of each other:
 *
 *   1. `typescript-eslint` refuses TypeScript 7 outright — "does not support
 *      TS 7.0", thrown before a single file is read. No released version
 *      supports it: the newest (8.69.0) declares `typescript: <6.1.0`.
 *   2. Under ESLint 10, `eslint-plugin-react@7.37` crashes with
 *      "contextOrFilename.getFilename is not a function".
 *
 * Fixing either one alone still leaves the other.
 *
 * ── What this config does instead ───────────────────────────────────────────
 * It borrows the TypeScript parser from eslint-config-next (which is why the
 * project must be on TypeScript 6 — see the note in package.json) and enables
 * exactly one rule, skipping the React plugin that crashes.
 *
 *     npm run lint:hooks
 *
 * ── Why this rule and not a broader set ─────────────────────────────────────
 * On 2 Sep 2026 the seller dashboard called `useDashboardToast()` below an
 * `if (loading) return`, so it ran a different NUMBER of hooks before and after
 * auth resolved and threw "Rendered more hooks than during the previous render"
 * on every single visit. A second, latent one sat in /course-path/[id].
 *
 * `tsc` passed both. 133 tests passed both. `next build` passed both. Three
 * hand-written scanners produced mostly false positives before reading found
 * the real two. This rule finds them in under a second, and it is syntactic —
 * it needs no type information and cannot be defeated by the type checker
 * being happy.
 *
 * When eslint-config-next ships a React plugin that works on ESLint 10, and
 * typescript-eslint supports TS 7, delete this file and use eslint.config.mjs.
 */

/** The parser, lifted from the Next TS config. */
const tsBlock = nextTypescript.find((c) => c?.languageOptions?.parser) ?? {};

/**
 * The typescript-eslint plugin is registered but NONE of its rules are turned
 * on. It is here only so that the `eslint-disable` comments already scattered
 * through the codebase — which name rules like
 * `@typescript-eslint/no-require-imports` — resolve to something. Without it
 * ESLint fails with "Definition for rule ... was not found" on a file that has
 * no actual problem.
 */
const tsPlugins = Object.assign({}, ...nextTypescript.map((c) => c?.plugins ?? {}));

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'examples/**',
      'skills/**',
      'scripts/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: tsBlock.languageOptions,
    plugins: { ...tsPlugins, 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
    },
  },
];
