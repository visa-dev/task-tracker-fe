module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },

  settings: { react: { version: 'detect' } },

  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',

    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // optional: keep or disable this depending on preference
    'react/no-unescaped-entities': 'off',
  },
}
