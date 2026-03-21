module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },
    settings: {
        react: { version: 'detect' },
    },
    rules: {
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'no-comments': 'error',
        'no-empty': ['error', { allowEmptyCatch: true }],
    },
    overrides: [
        {
            files: ['tests/**/*.{js,jsx}'],
            globals: {
                vi: 'readonly',
            },
            rules: {
                'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
            },
        },
    ],
}
