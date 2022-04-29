import { log } from './modules/helpers'
import display_tor_stats from './modules/tor_nodes'
import get_dao_node_stats from './modules/onion_nodes_status'

window.onload = f => {

	display_tor_stats()
	
	
}

// Listing for form input
document.querySelector('#nodeForm').addEventListener('submit', (e)=> {
	// prevents page reloading
	e.preventDefault() 

	// Get input from form
	const input = document.querySelector('#clientIp')

	// Trim any spaces before or after input
	const trimmed = input.value.trim()
  
	// If Value is trimmed continue
	if (trimmed) {

		// Get node value from input
		get_dao_node_stats(input.value)

		// For testing purposes
		log('client info retrieved')
	}
	return false
})