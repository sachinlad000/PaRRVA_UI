import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { useConfigStore } from '../../stores/configStore';
import { prepareEncryptedPayload } from '../crypto/jwe';
import type { ParsedEndpoint } from '../postman/endpoints';

// Create axios instance
const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor for adding auth token
    client.interceptors.request.use(
        (config) => {
            const { token } = useAuthStore.getState();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor for handling errors
    client.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                useAuthStore.getState().logout();
            }
            return Promise.reject(error);
        }
    );

    return client;
};

export const apiClient = createApiClient();

/**
 * Send an encrypted request to an endpoint
 */
export async function sendEncryptedRequest(
    endpoint: ParsedEndpoint,
    payload: unknown,
    options?: { useAuth?: boolean }
): Promise<{
    data: unknown;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    duration: number;
    encryptedPayload: string;
}> {
    const startTime = performance.now();
    const config = useConfigStore.getState();
    const auth = useAuthStore.getState();

    // Determine which public key to use
    const publicKey = endpoint.category === 'auth' ? config.authPublicKey : config.dataPublicKey;

    // Encrypt the payload
    const encryptedPayload = await prepareEncryptedPayload(
        payload,
        publicKey,
        endpoint.payloadFormat
    );

    // Prepare headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (endpoint.requiresAuth && auth.token && options?.useAuth !== false) {
        headers['Authorization'] = `Bearer ${auth.token}`;
    }

    // Determine base URL
    const baseUrl = endpoint.category === 'auth' ? config.authBaseUrl : config.dataBaseUrl;
    const url = `${baseUrl}${endpoint.path}`;

    try {
        const response = await apiClient.request({
            method: endpoint.method,
            url,
            data: encryptedPayload,
            headers,
        });

        const duration = performance.now() - startTime;

        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
            duration,
            encryptedPayload: JSON.stringify(encryptedPayload, null, 2),
        };
    } catch (error) {
        const duration = performance.now() - startTime;

        if (axios.isAxiosError(error) && error.response) {
            return {
                data: error.response.data,
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers as Record<string, string>,
                duration,
                encryptedPayload: JSON.stringify(encryptedPayload, null, 2),
            };
        }

        throw error;
    }
}

/**
 * Authenticate with the API
 */
export async function authenticate(
    username: string,
    password: string,
    role: 'RA' | 'IA'
): Promise<{ success: boolean; token?: string; error?: string }> {
    const config = useConfigStore.getState();

    try {
        // Encrypt credentials
        const payload = { username, password, role };
        const encryptedPayload = await prepareEncryptedPayload(
            payload,
            config.authPublicKey,
            'object'
        );

        const response = await apiClient.post(
            `${config.authBaseUrl}/api/parrva/pdc/auth/authenticate`,
            encryptedPayload
        );

        if (response.data?.token) {
            useAuthStore.getState().setAuth(response.data.token, role, username);
            return { success: true, token: response.data.token };
        }

        return { success: false, error: 'No token received' };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
        return { success: false, error: 'Authentication failed' };
    }
}

/**
 * Generate a JWE preview for the given payload
 */
export async function generateJWEPreview(
    payload: unknown,
    publicKey: string,
    format: 'array' | 'object' = 'array'
): Promise<string> {
    try {
        const encrypted = await prepareEncryptedPayload(payload, publicKey, format);
        return JSON.stringify(encrypted, null, 2);
    } catch (error) {
        throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
