import { log } from './helpers'

export default async function get_dao_node_stats(clientIp) {

	// Get ip from property
	const ipaddress = clientIp

	try {

		// Get metrics from api with client input
		const metrics = await fetch( `https://oniondao.web.app/api/tor_nodes/${ ipaddress }` ).then( res => res.text() )
		log( `Retrieved metrics: `, metrics )

		/* ///////////////////////////////
		// Fill metrics into DOM */

		// Percentage contributes
		const clients_metrics = document.querySelectorAll( '.client-metric.tor-contribution-status' )
		clients_metrics.forEach( element => {
			element.innerHTML = `${ metrics }%`
		} )

	} catch( e ) {
		log( `Metrics error: `, e )
	}

}