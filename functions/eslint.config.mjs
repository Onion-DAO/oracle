// Shared style rules, see https://github.com/actuallymentor/airier
import { eslint_config } from 'airier'

export default [
    ...eslint_config,
    { languageOptions: { sourceType: 'commonjs' } },

    // node:test exports test(), airier declares it as a jest global
    { files: [ 'test/**' ], rules: { 'no-redeclare': 'off' } },
]
