import { log } from './helpers'

export default async function display_tor_stats() {

	try {

		// Get metrics from api
		const metrics = await fetch( `https://oniondao.web.app/api/tor_nodes/metrics` ).then( res => res.json() )
		log( `Retreived metrics: `, metrics )

		/* ///////////////////////////////
		// Fill metrics into DOM */

		// Percentage contributes
		const percentage_fields = document.querySelectorAll( '.metric.tor-contribution-percentage' )
		percentage_fields.forEach( element => {
			element.textContent = `${ metrics.percent_contribution }%`
		} )

		const count_fields = document.querySelectorAll( '.metric.tor-node-count' )
		count_fields.forEach( element => {
			element.textContent = `${ metrics.count }`
		} )

	} catch( e ) {
		log( `Metrics error: `, e )
	}

}