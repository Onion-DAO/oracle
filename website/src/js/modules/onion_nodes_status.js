import { log } from './helpers'

export default async function get_dao_node_stats( clientIp ) {
	
	try {

		// Get metrics from api with client input
		const metrics = await fetch( `https://oniondao.web.app/api/tor_nodes/${ encodeURIComponent( clientIp ) }` ).then( res => res.text() )
		log( `Retrieved metrics: `, metrics )

		/* ///////////////////////////////
		// Fill metrics into DOM */

		// The api echoes user-controlled strings (wallets), so only ever render it as text
		const clients_metrics = document.querySelectorAll( '.client-metric.tor-contribution-status' )
		clients_metrics.forEach( element => {
			element.textContent = metrics
		} )

	} catch( e ) {
		log( `Metrics error: `, e )
	}

}