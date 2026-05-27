import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,

  {
    rules: {
      'no-unused-vars': ['off', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
    },
  },

  eslintConfigPrettier,
];
