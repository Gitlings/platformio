module.exports = {
  extends: [
    'airbnb-base',
    'plugin:vue/essential',
    // FIXME: https://github.com/eslint/eslint/issues/8813
    'plugin:jest/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    browser: true,
    jquery: true,
  },
  settings: {
    'import/resolver': {
      'babel-module': {
        // FIXME: https://github.com/tleunen/eslint-import-resolver-babel-module/issues/95
        alias: {
          common: '../common',
          "rust-common": '../rust_common',
        }
      },
    },
  },

  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        'jest': true,
      },
      plugins: ['jest'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],

  rules: {
    'import/extensions': ['error', 'always', {
      js: 'never',
      mjs: 'never',
    }],
    quotes: ['error', 'single', { 'avoidEscape': true }],
    'no-use-before-define': ['error', { 'functions': false }],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'no-param-reassign': 'off',
    'no-console': 'off',
    'no-unused-vars': ["error", { "argsIgnorePattern": "^_" }],
    'no-mixed-operators': ['error', {
      groups: [
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof']
      ],
      allowSamePrecedence: true,
    }],
    'no-continue': 'off',
    'operator-linebreak': 'off',
  },
};
