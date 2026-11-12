import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/', 'docs/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs.recommended,
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y-x': jsxA11y, 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.*'],
    languageOptions: { globals: globals.node },
  },
  {
    // Domain and pure library modules must stay framework- and network-free (AGENTS.md).
    files: ['src/domain/**/*.ts', 'src/lib/time.ts', 'src/lib/units.ts', 'src/lib/geo.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['react', 'react-dom', '*/services/*', '../services/*'] }],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'fetch', 'localStorage', 'sessionStorage'],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
);
