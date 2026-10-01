import dir from 'recursive-readdir'
import { normalize } from 'path'
import { promises as fs } from 'fs'

// Some sites block requests that do not look like a browser
const headers = { 'User-Agent': 'Chrome/79.0.3945.117' }

// Native fetch, slow hosts count as broken after 30s
const request = uri => fetch( uri, { headers, signal: AbortSignal.timeout( 1000 * 30 ) } )

// Fallback request
const get = async link => {

	// If it has a protocol:
	if( !link.url.match( /^\/\// ) ) return request( link.url )

	// If it has no protocol
	console.log( `https:${ link.url }` )

	// Try https
	const https = await request( `https:${ link.url }` ).catch( e => false )
	if( https ) return https

	console.log( 'Https didnt bite' )

	// Otherwise try http
	const http = await request( `http:${ link.url }` ).catch( e => false )
	if( http ) return http

	// If neither worked..
	return { message: `Link has no protocol and doesn't respond on http or https` }


}

// Match all hrefs that have a // (external)
export const urls = str => Array.from( str.matchAll( /(?:href=(?:'|"))(.*?\/\/.*?)(?:"|')/g ), m => m[1] )

// Check if url is broken
export const isBroken = link => get( link )
.then( ( { status } ) => status == 200 ? false : { ...link, code: status } )
.catch( ( { cause, name, message, ...other } ) => ( { ...link, code: cause?.code || name || message || other } ) )

// Get links with files
export const getLinks = async path => {
	// Get the paths to files
	const paths = await dir( path, [ '*.png', '*.jpg', '*.pdf', '*.gif' ] )

	// Get markdown and fix footnoe structure to match npm module syntax
	const files = await Promise.all( paths.map( async path => ( {
		path: normalize( path ), content: await fs.readFile( path, 'utf8' )
	} ) ) )

	const linksByFile = files.map( md => ( {
		path: md.path,
		urls: urls( md.content )
	} ) )

	let linksWithFile = linksByFile.map( file => {
		return file.urls.map( url => ( { url: url, path: file.path } ) )
	} ).flat()

	return linksWithFile
}