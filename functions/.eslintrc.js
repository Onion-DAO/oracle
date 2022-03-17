module.exports = {
    env: {
        "node": true,
        "commonjs": true,
        "es2021": true
    },
    extends: "eslint:recommended",
    parserOptions: {
        "ecmaVersion": 12
    },
    rules: {
        "no-case-declarations": 0,
        "prefer-arrow-callback": 2,
        "no-mixed-spaces-and-tabs": 1,
        "no-unused-vars": [ 1, { vars: 'all', args: 'none' } ], // All variables, no function arguments
        "no-control-regex": 0
    }
}