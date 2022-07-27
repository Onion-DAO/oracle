import { log } from './modules/helpers'
import { header } from './layout/header'
import display_tor_stats from './modules/tor_nodes'
import get_dao_node_stats from './modules/onion_nodes_status'

window.onload = f => {

	header()

	display_tor_stats()
	
}

if ( document.querySelector( '#nodeForm' ) !== null ) {

	document.querySelector( '#nodeForm' ).addEventListener( 'submit', (e)=> {

		e.preventDefault() 

		const input = document.querySelector( '#clientIp' )
		const valueTrimmed = input.value.trim()

		if( valueTrimmed !== null && valueTrimmed !== '' ) {

			get_dao_node_stats( valueTrimmed )

		} else {

			log( `input is empty, no need for api` )

		}

		return false

	})
}