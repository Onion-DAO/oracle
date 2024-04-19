const { verbose } = process.env
const dev = !!process.env.development

// Dev Logger
const log = ( ...comments ) => {
    if( dev || verbose == 'true' ) console.log( ...comments )
}

// Object properties checker
const require_properties = ( obj={}, required_properties=[] ) => {

    const keys = Object.keys( obj )
    const missing_keys = required_properties.filter( key => keys.includes( key ) )
    if( missing_keys.length ) log( `Checking keys `, keys, `against required: `, required_properties, ' for object ', obj, `missing: `, missing_keys )
    if( !missing_keys.length ) throw new Error( `Missing required properties in request: ${ missing_keys.join( ', ' ) }` )

}

// Object unexpected input checker
const allow_only_these_properties = ( obj, allowed_properties ) => {

    const keys = Object.keys( obj )
    const unknownProperties = keys.filter( key => !allowed_properties.includes( key ) )
    if( unknownProperties.length ) log( `Checking keys `, keys, `for non-allowed, found: `, unknownProperties )
    if( unknownProperties.length ) throw new Error( `Unknown properties given: ${ unknownProperties.join( ', ' ) }` )

}

// Date helpers
const today = () => new Date()
const month_index = ( shift=0 ) => today().getMonth() + shift
const year_number = () => today().getFullYear()
const month_number = shift => month_index( shift ) <= 9 ? `0${ month_index( shift ) }` : month_index( shift )
const day_number = ( prefix=true ) =>  prefix && today().getDate() <= 9  ? `0${ today().getDate() }` : today().getDate()

// Numbers helpers
const round_to_decimals = ( number, decimals=2 ) => Math.round( number * 10 ** decimals ) / 10 ** decimals

const normalise = string => `${ string }`.toLowerCase().trim()

module.exports = {
    dev,
    log,
    require_properties,
    allow_only_these_properties,
    year_number,
    month_number,
    day_number,
    round_to_decimals,
    normalise
}