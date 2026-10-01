// promise based file parsing
const { del, mkdir } = require( __dirname + '/parse-fs' )
const { promises: fs } = require( 'fs' )

// Image parsing
const compressImage = require( __dirname + '/parse-images' )

const copyfolder = async ( source, destination, filename ) => {

	await mkdir( destination )

	// No force means no overwrites for existing files
	await fs.cp( source, destination, { recursive: true, force: false } )
}

const copyassets = async ( site, filename ) => {

	try {

		const { extensions } = site.system.images

		// Delete the stale copy of a single changed asset so it gets copied again
		// ( a full build starts with an empty public folder, the old `assets/*` glob never matched anything )
		if( filename ) await del( `${ site.system.public }/assets/${ filename }` )

		// Copy entire asset folder
		await copyfolder( site.system.source + 'assets', site.system.public + 'assets' )

		// If single file, compress single file
		const [ fullmatch, extOfFilename ] = ( filename && filename.match( /(?:.*)(?:\.)(.*)/ ) ) || [ 0, [] ]
		if( extensions.includes( extOfFilename ) ) await compressImage( site, filename )

		// If not a single file, grab the images and compress them
		if( !filename ) {

			const allAssets = await fs.readdir( `${ site.system.source }/assets/` )
			const allImages = allAssets.filter( path => {
				const [ fm, ext ] = ( path && path.match( /(?:.*)(?:\.)(.*)/ )  ) || []
				return extensions.includes( ext )
			} )

			// Convert all
			await Promise.all( allImages.map( img => compressImage( site, img ) ) )

		}

	} catch( e ) {
		console.log( `Error copying assets: `, e )
		throw e
	}
	

}

module.exports = copyassets