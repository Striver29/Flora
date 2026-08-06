import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.expo/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js'],
        },
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      eqeqeq: 'error',
      'import/no-unresolved': 'error',
    },
  },
  prettierConfig,
];
