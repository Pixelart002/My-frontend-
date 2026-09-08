import js from '@eslint/js';
import react from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**'], linterOptions: { noInlineConfig: true } },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { window: 'readonly', document: 'readonly', sessionStorage: 'readonly', fetch: 'readonly', FormData: 'readonly', Response: 'readonly', AbortSignal: 'readonly', crypto: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', URLSearchParams: 'readonly' }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: { ...react.configs.recommended.rules, 'react/react-in-jsx-scope': 'off', 'no-unused-vars': 'off', 'no-undef': 'off', 'react/prop-types': 'off', 'react/no-unknown-property': 'off', 'react/no-unescaped-entities': 'off' },
  },
  prettier,
];
