module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'array-callback-return': 'error',
        'eqeqeq': 'error',
        'no-var': 'error',
        'prefer-const': ['error', { destructuring: 'all' }],
        '@typescript-eslint/no-duplicate-enum-values': 'error',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
    },
    ignorePatterns: ['**/dist/**/*', '*.js'],
};
