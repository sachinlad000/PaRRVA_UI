// Local CORS Proxy Server
// Run with: node proxy-server.cjs
// This proxies requests to careparrva.com and NSE APIs for local development

const http = require('http');
const https = require('https');

const PORT = 3001;

// Disable SSL certificate verification for testing
// This allows connecting to servers with self-signed or incomplete certificate chains
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ROUTES = {
    '/api/auth/authenticate': {
        target: 'https://careparrva.com/api/parrva/pdc/auth/authenticate',
        method: 'POST'
    },
    '/api/nse': {
        // Dynamic routing - will be handled in code
        baseUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput',
        method: 'POST'
    }
};

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : null);
            } catch (e) {
                resolve(body);
            }
        });
        req.on('error', reject);
    });
}

function proxyRequest(targetUrl, method, headers, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            // Explicitly disable SSL verification (already done via env var, but being explicit)
            rejectUnauthorized: false
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                resolve({
                    status: proxyRes.statusCode,
                    headers: proxyRes.headers,
                    body: data
                });
            });
        });

        proxyReq.on('error', (e) => {
            console.error('Proxy error:', e.message);
            reject(e);
        });

        if (body) {
            proxyReq.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        proxyReq.end();
    });
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    try {
        const body = await parseBody(req);
        let targetUrl;
        let proxyHeaders = {};

        // Get auth header if present
        if (req.headers.authorization) {
            proxyHeaders['Authorization'] = req.headers.authorization;
        }

        // Route: Auth API
        if (req.url === '/api/auth/authenticate') {
            targetUrl = ROUTES['/api/auth/authenticate'].target;
        }
        // Route: NSE API (dynamic path)
        else if (req.url.startsWith('/api/nse/')) {
            // Path format: /api/nse/{role}/{adviceType}
            const parts = req.url.split('/');
            const role = parts[parts.length - 2]?.toLowerCase();
            const adviceType = parts[parts.length - 1]?.toLowerCase();

            console.log(`  -> Proxying for role: ${role}, type: ${adviceType}`);

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
            if (adviceType === 'algoinput') {
                targetUrl = `https://clientprofilinguat.nseindia.com/api/advice/algoinput`;
            } else {
                targetUrl = `https://clientprofilinguat.nseindia.com/api/advice/${inputType}/${adviceType}`;
            }
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
            return;
        }

        console.log(`  -> Final Target URL: ${targetUrl}`);

        const stringBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';

        // Add headers to mimic browser/Postman and prevent ECONNRESET
        const targetUrlObj = new URL(targetUrl);
        const headersToForward = {
            ...proxyHeaders,
            'Host': targetUrlObj.hostname,
            'User-Agent': 'PostmanRuntime/7.32.3',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(stringBody)
        };

        console.log(`  -> Outgoing Headers:`, JSON.stringify(headersToForward, null, 2));

        const response = await proxyRequest(targetUrl, req.method, headersToForward, stringBody);

        console.log(`  <- Response Status: ${response.status}`);
        console.log(`  <- Response Body:`, response.body ? response.body.substring(0, 200) : '(empty)');

        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(response.body);

    } catch (error) {
        console.error('Error in proxy handling:', error.message);
        // Special case for ECONNRESET
        if (error.code === 'ECONNRESET') {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Connection Reset by Target Server',
                hint: 'The NSE server closed the connection. Check VPN/Network or if the URL/Headers are correct.',
                code: 'ECONNRESET'
            }));
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: error.message,
                hint: 'Check if the target server is accessible'
            }));
        }
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 Local CORS Proxy Server running on http://localhost:${PORT}`);
    console.log(`⚠️  SSL verification DISABLED for testing`);
    console.log(`\nRoutes:`);
    console.log(`  POST /api/auth/authenticate -> careparrva.com`);
    console.log(`  POST /api/nse/{role}/{type} -> clientprofilinguat.nseindia.com`);
    console.log(`\nTo use: Run 'npm run dev' in another terminal and the app will use this proxy.\n`);
});
