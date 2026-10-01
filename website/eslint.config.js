const js = require( '@eslint/js' )
const globals = require( 'globals' )

module.exports = [

    // Never lint build output
    { ignores: [ 'docs/', 'public/' ] },

    // Recommended features
    js.configs.recommended,

    {
        // Specific rules, 2: err, 1: warn, 0: off
        rules: {
            "prefer-arrow-callback": 2,
            "no-mixed-spaces-and-tabs": 1,
            "no-unused-vars": [ 1, { vars: 'all', args: 'none' } ] // All variables, no function arguments
        },

        // What global variables should be assumed to exist
        languageOptions: {
            ecmaVersion: 'latest',
            globals: { ...globals.node, ...globals.browser, ...globals.mocha }
        }
    },

    // Build scripts are commonjs, browser and test code are modules
    { files: [ '*.js', 'modules/**/*.js', 'src/content/*.js' ], languageOptions: { sourceType: 'commonjs' } },
    { files: [ 'src/js/**/*.js', 'test/**/*.mjs' ], languageOptions: { sourceType: 'module' } }

]
