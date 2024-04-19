exports.ping_mentor = async function( { title, message, url='https://oniondao.web.app', priority='0' } ) {

    // Dependencies
    const fetch = require( 'isomorphic-fetch' )
    const { log } = require( './helpers' )

    // Ping Mentor
    try {

        const { PUSHOVER_TOKEN, PUSHOVER_USER } = process.env
        if( !PUSHOVER_TOKEN || !PUSHOVER_USER ) throw new Error( `Missing Pushover credentials` )

        await fetch( `https://api.pushover.net/1/messages.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( {
                token: PUSHOVER_TOKEN,
                user: PUSHOVER_USER,
                title,
                message,
                url,
                priority
            } )
        } )

    } catch ( e ) {

        log( `Pushover failure: `, e.message )

    }

}