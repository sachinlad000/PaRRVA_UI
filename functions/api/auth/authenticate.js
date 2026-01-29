// Cloudflare Pages Function - Auth API Proxy
// This proxies requests to CareParrva auth API to avoid CORS

export async function onRequestPost(context) {
    const { request } = context;

    try {
        const body = await request.json();

        console.log('Proxying auth request to careparrva.com');

        // Forward to CareParrva auth API
        const response = await fetch('https://careparrva.com/api/parrva/pdc/auth/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Get response text first to handle non-JSON responses
        const responseText = await response.text();
        console.log('Auth response status:', response.status);
        console.log('Auth response body:', responseText.substring(0, 500));

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // If not JSON, return error with response info
            return new Response(JSON.stringify({
                error: 'Invalid response from auth server',
                status: response.status,
                details: responseText.substring(0, 200)
            }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        // Return response with CORS headers
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            type: 'proxy_error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
