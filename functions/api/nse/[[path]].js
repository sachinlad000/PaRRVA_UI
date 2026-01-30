// Cloudflare Pages Function - NSE API Proxy
// This proxies requests to NSE API endpoints to avoid CORS
// Path: /api/nse/[...path]

// NSE API base URL
const NSE_BASE_URL = 'https://clientprofilinguat.nseindia.com/api/advice/iainput';

export async function onRequestPost(context) {
    const { request, params } = context;

    try {
        const body = await request.json();
        const pathParts = params.path;

        // Path format: /api/nse/{role}/{adviceType}
        const role = pathParts[pathParts.length - 2]?.toLowerCase();
        const adviceType = pathParts[pathParts.length - 1]?.toLowerCase();

        // Determine base path (iainput vs rainput) based on Postman collection
        let inputType = 'iainput'; // Default

        if (adviceType === 'portfolio') {
            inputType = 'rainput';
        } else if (adviceType === 'intraday' || adviceType === 'derivative') {
            inputType = (role === 'ra') ? 'rainput' : 'iainput';
        } else if (adviceType === 'strategy' || adviceType === 'singlestock') {
            inputType = 'iainput';
        }

        // Construct target URL
        let targetUrl;
        if (adviceType === 'algoinput') {
            targetUrl = `https://clientprofilinguat.nseindia.com/api/advice/algoinput`;
        } else {
            targetUrl = `https://clientprofilinguat.nseindia.com/api/advice/${inputType}/${adviceType}`;
        }

        console.log('Proxying NSE request to:', targetUrl);

        // Get authorization header from request
        const authHeader = request.headers.get('Authorization');

        // Forward to NSE API with requested headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'User-Agent': 'PostmanRuntime/7.32.3'
        };

        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        // Get response text first to handle non-JSON responses
        const responseText = await response.text();
        console.log('NSE response status:', response.status);
        console.log('NSE response body:', responseText.substring(0, 500));

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return new Response(JSON.stringify({
                error: 'Invalid response from NSE server',
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
        console.error('NSE proxy error:', error);
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
