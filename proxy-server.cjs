const http = require('http');
const https = require('https');
const crypto = require('crypto');

const PORT = 3001;

// Global flag to disable SSL verification (for financial UAT servers)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Global HTTPS Agent to maintain connection pool and handle TLS quirks
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: 50,
    keepAliveMsecs: 1000,
    // Fix for older/strict TLS implementations
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
});

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : null);
            } catch (e) {
                resolve(body);
            }
        });
    });
}

function proxyRequest(targetUrl, method, headers, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);
        const stringBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                ...headers,
                'Host': url.hostname,
                'Origin': url.origin,
                'Referer': url.origin + '/',
                'Content-Length': Buffer.byteLength(stringBody)
            },
            agent: httpsAgent,
            timeout: 60000 // 60 seconds
        };

        console.log(`  -> Sending Proxy Request: ${method} ${targetUrl}`);

        const proxyReq = https.request(options, (proxyRes) => {
            let resData = '';
            proxyRes.on('data', chunk => { resData += chunk; });
            proxyRes.on('end', () => {
                resolve({
                    status: proxyRes.statusCode,
                    headers: proxyRes.headers,
                    body: resData
                });
            });
        });

        proxyReq.on('timeout', () => {
            console.error(`  !! Proxy Request Timeout: ${targetUrl}`);
            proxyReq.destroy();
            reject(new Error('Connection timed out after 60s'));
        });

        proxyReq.on('error', (e) => {
            console.error(`  !! Proxy Request Error [${e.code}]: ${e.message}`);
            reject(e);
        });

        if (stringBody) {
            proxyReq.write(stringBody);
        }
        proxyReq.end();
    });
}

const server = http.createServer(async (req, res) => {
    // Enable CORS for browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        const body = await parseBody(req);
        let targetUrl = '';

        const proxyHeaders = {
            'Content-Type': 'application/json'
        };

        if (req.headers['authorization']) {
            proxyHeaders['Authorization'] = req.headers['authorization'];
        }

        // Route: Auth
        if (req.url === '/api/auth/authenticate') {
            targetUrl = 'https://careparrva.com/api/parrva/pdc/auth/authenticate';
        }
        // Route: NSE
        else if (req.url.startsWith('/api/nse/')) {
            const parts = req.url.split('/');
            const role = parts[parts.length - 2]?.toLowerCase();
            const adviceType = parts[parts.length - 1]?.toLowerCase();

            let inputType = 'iainput';
            if (adviceType === 'portfolio') {
                inputType = 'rainput';
            } else if (adviceType === 'intraday' || adviceType === 'derivative') {
                inputType = (role === 'ra') ? 'rainput' : 'iainput';
            }

            if (adviceType === 'algoinput') {
                targetUrl = `https://clientprofilinguat.nseindia.com/api/advice/algoinput`;
            } else {
                targetUrl = `https://clientprofilinguat.nseindia.com/api/advice/${inputType}/${adviceType}`;
            }
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
            return;
        }

        const headersToForward = {
            ...proxyHeaders,
            'User-Agent': 'PostmanRuntime/7.32.3',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        };

        const result = await proxyRequest(targetUrl, req.method, headersToForward, body);

        console.log(`  <- Target Response [${result.status}]`);
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(result.body);

    } catch (error) {
        console.error('Proxy Server Critical Error:', error.message);
        const isNSE = targetUrl?.includes('nseindia');
        res.writeHead(error.code === 'ECONNRESET' ? 502 : 500);
        res.end(JSON.stringify({
            error: error.message,
            code: error.code,
            hint: isNSE ? 'NSE connection reset. Check VPN/Network settings.' : 'Authentication server connection error.'
        }));
    }
});

server.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `🚀 Persistent Proxy Server listening on http://localhost:${PORT}`);
    console.log(`⚠️  SSL Verification: DISABLED`);
});
