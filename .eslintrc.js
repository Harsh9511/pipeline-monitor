module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: { // Some basic lint rules added by me. Edit them as and when needed...
        'no-console': 'warn',
        'no-unused-vars': 'warn',
        'no-undef': 'error',
        'semi': ['error', 'always'],
        'quotes': ['warn', 'single'],
    },
}; 