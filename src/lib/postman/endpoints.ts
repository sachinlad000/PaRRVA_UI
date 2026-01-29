/**
 * Parsed endpoint definitions extracted from Postman collection
 */

export interface EndpointField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
    required?: boolean;
    description?: string;
}

export interface ParsedEndpoint {
    id: string;
    name: string;
    category: 'ra' | 'ia' | 'auth' | 'algo';
    method: 'POST' | 'GET';
    baseUrl: string;
    path: string;
    fullUrl: string;
    requiresAuth: boolean;
    payloadFormat: 'array' | 'object';
    publicKey: string;
    fields: EndpointField[];
    examplePayload: unknown;
    description?: string;
}

// Public key for data endpoints (NSE India)
export const DATA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAojQVs6yFZR/Gs46x6wqc
8m1aeaSX3hXHvRDGKeEsJ7/Umb5GmPkUdlximFEPTyhCYSfR4WwtO4B3VaUStX35
JbUoeRwFFuz+z4ZR1Dr1CyKrnLthhcyG7WFxZ1nITXVI32ZTBZFskpcQ/JGO0y/d
9KbuVoLRU2r6IIoK3sfh4FhOkpmnyZA+jbuAU0ayUsjjHvbBcGja0Q3MOLlasxav
lmPWLrUkVV7Gp79p4edONXw81yG6b+WeJhjUqs8M3hxmFJpPA4GfOYze8q0kA++i
eEZIe30L4Te8GwkDYcNk1SBDScVHEcr+pwGoJB4DoCBODvSSzKn4G42z7ZKdmi1p
pQIDAQAB
-----END PUBLIC KEY-----`;

// Public key for auth endpoint (CareParrva)
export const AUTH_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtCTj4Oo+RbfXCWXuLLMI
MSZVwy6nG4a0T3y5ALW2w7nDCk/SWmd1HMvj6R92Pk8ta1P3HNgmGvWikUMiAOgP
NBe35mT0SUv7mFTcSQeTKnhto7tbr2R+hnwA/7o2Fn1iEqcqNdz4fSSULGaloVv/
amwPVwKH1z0RQgaLjtvBTKwKxP6LUOJnUo0G9BuH0eNHfmG4En9sYZgs4sAyKK1a
6oz+qDYatp2Bv/JRf0Kjnxi7GtiiKhCUWgW5jDIY42Q5D1Gsld8xeUeYYS6A1D/w
u0WqJp1oJ9pEV5D+oRdQotYKQqoTllBaJ4NmsigfNr5a9/3UvDY5F7s7MnYhuMSk
DQIDAQAB
-----END PUBLIC KEY-----`;

export const ENDPOINTS: ParsedEndpoint[] = [
    // Authentication
    {
        id: 'auth',
        name: 'Authentication',
        category: 'auth',
        method: 'POST',
        baseUrl: 'https://careparrva.com',
        path: '/api/parrva/pdc/auth/authenticate',
        fullUrl: 'https://careparrva.com/api/parrva/pdc/auth/authenticate',
        requiresAuth: false,
        payloadFormat: 'object',
        publicKey: AUTH_PUBLIC_KEY,
        description: 'Login with username, password, and role (RA/IA)',
        fields: [
            { name: 'username', type: 'string', required: true, description: 'User ID' },
            { name: 'password', type: 'string', required: true, description: 'Password' },
            { name: 'role', type: 'string', required: true, description: 'RA or IA' },
        ],
        examplePayload: {
            username: '111222333',
            password: 'abcd',
            role: 'RA',
        },
    },

    // RA Strategy
    {
        id: 'ra-strategy',
        name: 'RA Strategy',
        category: 'ra',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/iainput/strategy',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput/strategy',
        requiresAuth: false,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit strategy advice (no auth required)',
        fields: [
            { name: 'adviceName', type: 'string', required: true },
            { name: 'exchange', type: 'string', required: true },
            { name: 'strategyName', type: 'string', required: true },
            { name: 'isIntraday', type: 'string', required: true },
        ],
        examplePayload: [
            {
                adviceName: 'Nifty09Jan23600PE',
                exchange: 'NSE',
                strategyName: 'LONG',
                isIntraday: 'no',
                strategyDetails: [
                    {
                        recommendationType: 'SELL',
                        derivativeName: 'Nifty09Jan23600P',
                        derivativeOptionStrikePrice: '23600',
                        derivativeOptionType: 'PE',
                        derivativeType: 'OPT',
                        derivativeExpiryDt: '2025-07-27',
                        derivativeQuantity: 1,
                        derivativeEntryDttm: '2025-05-27T05:39:40.848Z',
                        derivativeEntryPrice: 0,
                        derivativeTotalMargin: 7575,
                        derivativeTargetPrice: 115,
                        derivativeStopLoss: 95,
                        derivativeExitDttm: '2025-05-27T05:39:40.848Z',
                        derivativeExitPrice: 10,
                        derivativeLotSize: 75,
                        legId: 1,
                    },
                ],
            },
        ],
    },

    // IA Strategy
    {
        id: 'ia-strategy',
        name: 'IA Strategy',
        category: 'ia',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/iainput/strategy',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput/strategy',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit strategy advice (requires auth)',
        fields: [],
        examplePayload: [{ data: 'encrypted_jwe_token' }],
    },

    // RA Single Stock
    {
        id: 'ra-singlestock',
        name: 'RA Single Stock',
        category: 'ra',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/iainput/singlestock',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput/singlestock',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit single stock recommendation',
        fields: [
            { name: 'shortTermRecommendationType', type: 'string', required: true },
            { name: 'exchange', type: 'string', required: true },
            { name: 'adviceName', type: 'string', required: true },
            { name: 'shortTermEntryDt', type: 'datetime', required: true },
            { name: 'shortTermStockName', type: 'string', required: true },
            { name: 'shortTermIsin', type: 'string', required: true },
            { name: 'shortTermHorizon', type: 'number', required: true },
            { name: 'shortTermEntryPrice', type: 'number', required: true },
            { name: 'shortTermTargetPrice', type: 'number', required: true },
            { name: 'shortTermSlPrice', type: 'number', required: true },
        ],
        examplePayload: [
            {
                shortTermRecommendationType: 'BUY',
                exchange: 'NSE',
                adviceName: 'HONDAPOWER01',
                shortTermEntryDt: '2026-01-05T13:00:00.000Z',
                shortTermStockName: 'HONDAPOWER',
                shortTermIsin: 'INE634A01018',
                shortTermHorizon: 30,
                shortTermEntryPrice: 2690,
                shortTermTargetPrice: 2750,
                shortTermSlPrice: 2600,
            },
        ],
    },

    // IA Single Stock
    {
        id: 'ia-singlestock',
        name: 'IA Single Stock',
        category: 'ia',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/iainput/singlestock',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput/singlestock',
        requiresAuth: false,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit single stock recommendation (no auth)',
        fields: [],
        examplePayload: [
            {
                shortTermRecommendationType: 'BUY',
                exchange: 'NSE',
                adviceName: 'HONDAPOWER01',
                shortTermEntryDt: '2026-01-05T13:00:00.000Z',
                shortTermStockName: 'HONDAPOWER',
                shortTermIsin: 'INE634A01018',
                shortTermHorizon: 30,
                shortTermEntryPrice: 2690,
                shortTermTargetPrice: 2750,
                shortTermSlPrice: 2600,
            },
        ],
    },

    // RA Portfolio
    {
        id: 'ra-portfolio',
        name: 'RA Portfolio',
        category: 'ra',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/rainput/portfolio',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/rainput/portfolio',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit portfolio recommendation',
        fields: [
            { name: 'portfolioName', type: 'string', required: true },
            { name: 'portfolioType', type: 'string', required: true },
            { name: 'stopPortfolio', type: 'string', required: true },
        ],
        examplePayload: [
            {
                portfolioName: 'PortfolioTest1',
                portfolioType: 'Equity',
                stopPortfolio: 'No',
                details: [
                    {
                        securityName: 'SENCO',
                        isinNo: 'INE602W01027',
                        weightage: 0.25,
                        exchange: 'NSE',
                        isMutualFund: 'N',
                    },
                ],
            },
        ],
    },

    // IA Portfolio
    {
        id: 'ia-portfolio',
        name: 'IA Portfolio',
        category: 'ia',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/rainput/portfolio',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/rainput/portfolio',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit portfolio recommendation (IA)',
        fields: [],
        examplePayload: [],
    },

    // RA Intraday
    {
        id: 'ra-intraday',
        name: 'RA Intraday',
        category: 'ra',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/rainput/intraday',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/rainput/intraday',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit intraday recommendation',
        fields: [
            { name: 'adviceName', type: 'string', required: true },
            { name: 'techCallType', type: 'string', required: true },
            { name: 'exchange', type: 'string', required: true },
            { name: 'securityEntryDt', type: 'datetime', required: true },
            { name: 'techCallId', type: 'string', required: true },
            { name: 'isin', type: 'string', required: true },
            { name: 'techCallEntryPrice', type: 'number', required: true },
            { name: 'techCallTargetPrice', type: 'number', required: true },
            { name: 'techCallStopLoss', type: 'number', required: true },
            { name: 'note', type: 'string', required: false },
        ],
        examplePayload: [
            {
                adviceName: 'HINDUNILVR01',
                techCallType: 'BUY',
                exchange: 'NSE',
                securityEntryDt: '2025-05-25T10:52:07.996Z',
                techCallId: 'HINDUNILVR',
                isin: 'INE030A01027',
                techCallEntryPrice: 2360,
                techCallTargetPrice: 2370,
                techCallStopLoss: 2350,
                techCallExitDate: '2025-05-13T03:35:12.996Z',
                techCallExitPrice: 1425,
                note: ' ',
            },
        ],
    },

    // IA Intraday
    {
        id: 'ia-intraday',
        name: 'IA Intraday',
        category: 'ia',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/iainput/intraday',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput/intraday',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit intraday recommendation (IA)',
        fields: [],
        examplePayload: [],
    },

    // RA Derivative
    {
        id: 'ra-derivative',
        name: 'RA Derivative',
        category: 'ra',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/rainput/derivative',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/rainput/derivative',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit derivative recommendation',
        fields: [
            { name: 'recommendationType', type: 'string', required: true },
            { name: 'adviceName', type: 'string', required: true },
            { name: 'exchange', type: 'string', required: true },
            { name: 'derivativeType', type: 'string', required: true },
            { name: 'derivativeOptionType', type: 'string', required: true },
            { name: 'derivativeName', type: 'string', required: true },
            { name: 'derivativeExpiryDt', type: 'date', required: true },
            { name: 'derivativeEntryPrice', type: 'number', required: true },
            { name: 'derivativeEntryDttm', type: 'datetime', required: true },
            { name: 'derivativeQuantity', type: 'number', required: true },
            { name: 'derivativeTargetPrice', type: 'number', required: true },
            { name: 'derivativeStopLoss', type: 'number', required: true },
            { name: 'derivativeTotalMargin', type: 'number', required: true },
            { name: 'derivativeOptionStrikePrice', type: 'string', required: true },
            { name: 'isIntraday', type: 'string', required: true },
        ],
        examplePayload: [
            {
                recommendationType: 'BUY',
                adviceName: 'AXISBANK001',
                exchange: 'NSE',
                derivativeType: 'OPT',
                derivativeOptionType: 'CE',
                derivativeName: 'ADANIENT',
                derivativeExpiryDt: '2025-11-25',
                derivativeEntryPrice: 105,
                derivativeEntryDttm: '2025-10-29T9:16:00.000Z',
                derivativeQuantity: 1,
                derivativeTargetPrice: 110,
                derivativeStopLoss: 102,
                derivativeTotalMargin: 90000,
                derivativeOptionStrikePrice: '2500',
                isIntraday: 'No',
            },
        ],
    },

    // IA Derivative
    {
        id: 'ia-derivative',
        name: 'IA Derivative',
        category: 'ia',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/iainput/derivative',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/iainput/derivative',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit derivative recommendation (IA)',
        fields: [],
        examplePayload: [],
    },

    // Algo Input
    {
        id: 'algoinput',
        name: 'Algo Input',
        category: 'algo',
        method: 'POST',
        baseUrl: 'https://clientprofilinguat.nseindia.com',
        path: '/api/advice/algoinput',
        fullUrl: 'https://clientprofilinguat.nseindia.com/api/advice/algoinput',
        requiresAuth: true,
        payloadFormat: 'array',
        publicKey: DATA_PUBLIC_KEY,
        description: 'Submit algo trading data',
        fields: [
            { name: 'exchange', type: 'string', required: true },
            { name: 'tradingMember', type: 'string', required: true },
            { name: 'algoId', type: 'string', required: true },
            { name: 'uniqueClientCode', type: 'string', required: true },
            { name: 'segment', type: 'string', required: true },
            { name: 'fixedCapital', type: 'number', required: true },
        ],
        examplePayload: [
            {
                exchange: 'NSE',
                tradingMember: '118999',
                algoId: '695399',
                uniqueClientCode: 'MKS099',
                segment: 'FO',
                fixedCapital: 19520940,
            },
        ],
    },
];

export const getEndpointsByCategory = (category: string): ParsedEndpoint[] => {
    return ENDPOINTS.filter((e) => e.category === category);
};

export const getEndpointById = (id: string): ParsedEndpoint | undefined => {
    return ENDPOINTS.find((e) => e.id === id);
};

export const getCategories = () => [
    { id: 'auth', name: 'Authentication', icon: 'key' },
    { id: 'ra', name: 'Research Analyst', icon: 'bar-chart' },
    { id: 'ia', name: 'Investment Advisor', icon: 'trending-up' },
    { id: 'algo', name: 'Algo Trading', icon: 'cpu' },
];
