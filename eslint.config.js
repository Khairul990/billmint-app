import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
export default [
  { 
    ignores: [
      'dist', 'dev-dist', 'dist-electron', 'dist_electron', 'android', 'ios', '.capacitor', 
      'public', 'scratch', '_deleted_backup', 'src/pages/settings/**', 'src/contexts/**',
      'docs/**', 'electron/**', 'functions/**', 'scripts/**',
      '*.mjs', '*.cjs', 'patch_*.js', 'test*.js', 'test*.mjs', 'merge_templates.js'
    ] 
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'no-useless-assignment': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': 'off',
    },
  },
]
