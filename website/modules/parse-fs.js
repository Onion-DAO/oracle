const { promises: fs } = require( 'fs' )
const { normalize } = require('path')

const wait = ms => new Promise( res => setTimeout( res, ms ) )

// Promise structure for writing a file to disk
const writefile = fs.writeFile

// Check if a resource exists
const exists = what => fs.access( what ).then( f => true ).catch( f => false )

// Delete a file or folder, no complaints when it does not exist
const delp = what => fs.rm( what, { recursive: true, force: true } )

// Make directory (and parents) if it does not exist yet
const mkdir = path => fs.mkdir( path, { recursive: true } )

// Read the contents of these files and return as an array
const readdata = ( path, filename ) => fs.readFile( normalize( `${path}/${filename}` ), 'utf8' ).then( data => ( { filename: filename, data: data } ) )

// Safely write a file by chacking if the path exists
const safewrite = async ( path, file, content ) => {

	try {
		path = normalize( path )
		await mkdir( path )
		await writefile( path + file, content )
	} catch( e ) {
		console.log( `Error writing ${ path }${ file }: `, e )
	}

}

module.exports = {
	write: writefile,
	swrite: safewrite,
	del: delp,
	mkdir: mkdir,
	readFile: readdata,
	exists: exists
}