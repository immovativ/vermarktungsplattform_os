module.exports = {
  'ignorePatterns': ['**/*.html', '**/*.json'],
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'plugin:react/recommended',
    'google',
    'plugin:@typescript-eslint/recommended',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true,
    },
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'plugins': [
    'react',
    '@typescript-eslint',
    'unused-imports',
  ],
  'rules': {
    'semi': 'off',
    'max-len': ['error', {'code': 160}],
    'require-jsdoc': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'object-curly-spacing': 'off',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'destructuredArrayIgnorePattern': '^_',
    }],
    "react/prop-types": "off",
    "react/display-name": "off"
  },
  'settings': {
    'react': {
      'version': 'detect',
    },
  },
  'overrides': [
    {
      'files': ['**/*.ts', '**/*.tsx'],
    },
  ],
}
