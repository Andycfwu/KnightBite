import tseslint from 'typescript-eslint';
import next from '@next/eslint-plugin-next';
import hooks from 'eslint-plugin-react-hooks';
export default [
  { ignores: ['.next/**', 'node_modules/**', 'docs/audits/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
  ...tseslint.configs.recommended,
  // Node's preloader must be CommonJS, including before Next starts.
  { files: ['tests/support/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { files: ['components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'], rules: {
    'no-restricted-imports': ['error', { patterns: [{ group: ['@/lib/menu', '@/lib/providers/*', '@/lib/menu-item-identity'], message: 'Keep provider loading on the server; use menu-helpers for pure client selectors.' }] }]
  } },
  { files: ['**/*.{ts,tsx}'], plugins: { '@next/next': next, 'react-hooks': hooks }, rules: {
    ...next.configs.recommended.rules,
    'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
  } }
];
