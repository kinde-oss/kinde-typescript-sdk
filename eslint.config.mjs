import tseslint from '@typescript-eslint/eslint-plugin';
import typescript from '@typescript-eslint/parser';
import n from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import promise from 'eslint-plugin-promise';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // Global ignores
  globalIgnores(['**/dist', '**/dist-cjs']),

  // Base configuration for all files
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      quotes: ['error', 'single'],
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: typescript,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
    },
  },

  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ignores: ['**/*.ts', '**/*.tsx'],
  },

  // Other plugins
  {
    plugins: {
      n,
      promise,
    },
    rules: {
      'n/no-missing-import': 'off',
    },
  },

  // Prettier at the end to override formatting rules
  eslintPluginPrettierRecommended,
]);
