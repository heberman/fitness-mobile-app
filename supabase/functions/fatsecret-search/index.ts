import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Helper to get OAuth token
async function getAccessToken() {
	const clientId = Deno.env.get('FATSECRET_CLIENT_ID')
	const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET')

	const tokenResponse = await fetch('https://oauth.fatsecret.com/connect/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
		},
		body: 'grant_type=client_credentials&scope=basic',
	})

	const { access_token } = await tokenResponse.json()
	return access_token
}

serve(async (req) => {
	// Handle CORS
	if (req.method === 'OPTIONS') {
		return new Response('ok', {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
			},
		})
	}

	try {
		const { action, searchTerm, foodId, barcode } = await req.json()
		const accessToken = await getAccessToken()

		let data

		if (action === 'search') {
			// Search for foods by name
			const searchResponse = await fetch(
				`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(searchTerm)}&format=json`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			)
			data = await searchResponse.json()
		} else if (action === 'getFood') {
			// Get detailed food info by food_id
			const foodResponse = await fetch(
				`https://platform.fatsecret.com/rest/server.api?method=food.get.v5&food_id=${foodId}&format=json`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			)
			data = await foodResponse.json()
		} else if (action === 'barcode') {
			// Get detailed food info by food_id
			const foodResponse = await fetch(
				`https://platform.fatsecret.com/rest/server.api?method=food.find_id_for_barcode.v2&barcode=${barcode}&format=json`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			)
			data = await foodResponse.json()
		} else {
			throw new Error('Invalid action. Use "search", "getFood", or "barcode"')
		}

		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		})
	}
})
