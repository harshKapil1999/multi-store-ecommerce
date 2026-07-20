import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

const nextFiles = ['apps/admin/**/*.{js,jsx,ts,tsx}', 'apps/frontend/**/*.{js,jsx,ts,tsx}'];
const workspaceFiles = ['apps/backend/**/*.ts', 'packages/**/*.{ts,tsx}'];

export default defineConfig([
  globalIgnores([
    '**/.next/**',
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    'apps/frontend/public/**',
  ]),
  ...nextVitals.map((config) => ({ ...config, files: nextFiles })),
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: workspaceFiles })),
  {
    files: [...nextFiles, ...workspaceFiles],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: nextFiles,
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
]);
