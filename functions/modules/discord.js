exports.ping_discord = async function( { username, content, avatar_url } ) {

    try {

        // Dependencies
        const { DISCORD_WEBHOOK_ONIONDAO } = process.env
        const fetch = require( 'isomorphic-fetch' )
        const { log } = require( './helpers' )

        // Construct discord webhook message
        const message = {
            username,
            content,
            avatar_url,
            allowed_mentions: {
                parse: [ 'users' ]
            },
            embeds: [
                // { title: 'Image title', thumbnail: { url: url to thing } }
            ],
            flags: 1 << 2 // hide embed links https://discord.com/developers/docs/resources/channel#message-object-message-flags
        }

        // Construct request options
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( message )
        }

        // Make webhook request, https://discord.com/developers/docs/resources/webhook#execute-webhook-query-string-params
        const data = await fetch( `${ DISCORD_WEBHOOK_ONIONDAO }?wait=true`, options ).then( async res => {
            const clone_res =  res.clone()
            try { 
                const json = await res.json()
                return json
            } catch ( e ) {
                const text = await clone_res.text()
                return { code: res.status, message: text }
            }
        } )
        if( data.code ) throw new Error ( `Discord webhook failed with ${ data.code }: ${ data.message }` )

    } catch ( e ) {
        console.error( 'Discord error ', e )
    }

}