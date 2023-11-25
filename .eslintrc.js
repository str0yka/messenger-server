module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  plugins: ['import'],
  parserOptions: { ecmaVersion: 2018, sourceType: 'module' },
  rules: {
    'import/no-unresolved': 0,
    'import/order': [
      2,
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '~/*',
            group: 'internal',
          },
          {
            pattern: '../**',
            group: 'index',
          },
          {
            pattern: './**',
            group: 'index',
          },
        ],
        alphabetize: {
          order: 'asc',
        },
      },
    ],
  },
};
