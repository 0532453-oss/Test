/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    // --- Core ---
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'off', // handled by import/no-duplicates
    'no-undef': 'off', // TypeScript handles this

    // --- TypeScript ---
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],

    // --- Imports ---
    'import/no-duplicates': ['error', { considerQueryString: true }],
    'import/no-useless-path-segments': 'error',
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
  overrides: [
    // --- NestJS / Server ---
    {
      files: ['packages/flexdesk-server/**/*.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // --- React / Frontend ---
    {
      files: [
        'packages/flexdesk-preview/**/*.{ts,tsx}',
        'packages/flexdesk-preview-v2/**/*.{ts,tsx}',
        'packages/flexdesk-front/**/*.{ts,tsx}',
        'packages/flexdesk-ui/**/*.{ts,tsx}',
        'packages/flexdesk-core/**/*.{ts,tsx}',
        'packages/flexdesk-portal/**/*.{ts,tsx}',
        'packages/flexdesk-maps/**/*.{ts,tsx}',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    // --- Test files ---
    {
      files: [
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.integration-spec.{ts,tsx,js,jsx}',
        '**/test/**/*.{ts,tsx,js,jsx}',
        '**/__tests__/**/*.{ts,tsx,js,jsx}',
      ],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
      },
    },
    // --- JavaScript files ---
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'out/',
    'coverage/',
    '*.config.js',
    '*.config.mjs',
    '*.config.ts',
  ],
};
