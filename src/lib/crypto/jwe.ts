/**
 * JWE Encryption Service
 * Implements RSA-OAEP-256 with A256GCM encryption matching Postman's exact implementation
 */

/**
 * Convert PEM-formatted public key to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s+/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
}

/**
 * Base64URL encode a buffer (web-safe base64)
 */
function base64urlEncode(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Encrypt a payload using JWE with RSA-OAEP-256 and A256GCM
 * This matches the exact implementation from the Postman pre-request scripts
 */
export async function encryptJWE(payload: string, publicKeyPem: string): Promise<string> {
    // Generate a random 256-bit Content Encryption Key (CEK)
    const cek = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
    );

    // Import the RSA public key
    const publicKey = await crypto.subtle.importKey(
        'spki',
        pemToArrayBuffer(publicKeyPem),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );

    // Export CEK as raw bytes
    const cekRaw = await crypto.subtle.exportKey('raw', cek);

    // Encrypt the CEK with RSA-OAEP
    const encryptedKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        cekRaw
    );

    // Create JWE header
    const header = {
        alg: 'RSA-OAEP-256',
        enc: 'A256GCM',
    };

    // Encode header
    const headerBytes = new TextEncoder().encode(JSON.stringify(header));
    const encodedHeader = base64urlEncode(headerBytes.buffer as ArrayBuffer);

    // Generate random 96-bit IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt payload with AES-GCM
    const payloadBytes = new TextEncoder().encode(payload);
    const additionalData = new TextEncoder().encode(encodedHeader);

    const encryptedPayload = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
            additionalData: additionalData,
        },
        cek,
        payloadBytes
    );

    // Split ciphertext and authentication tag (last 16 bytes)
    const ciphertext = encryptedPayload.slice(0, encryptedPayload.byteLength - 16);
    const tag = encryptedPayload.slice(encryptedPayload.byteLength - 16);

    // Return 5-part JWE compact serialization
    return [
        encodedHeader,
        base64urlEncode(encryptedKey),
        base64urlEncode(iv.buffer as ArrayBuffer),
        base64urlEncode(ciphertext),
        base64urlEncode(tag),
    ].join('.');
}

/**
 * Prepare request payload by encrypting and wrapping in the appropriate format
 */
export async function prepareEncryptedPayload(
    data: unknown,
    publicKeyPem: string,
    format: 'array' | 'object' = 'array'
): Promise<{ data: string }[] | { data: string }> {
    const payload = JSON.stringify(data);
    const jwe = await encryptJWE(payload, publicKeyPem);

    if (format === 'array') {
        return [{ data: jwe }];
    }
    return { data: jwe };
}

/**
 * Validate a public key PEM format
 */
export function isValidPublicKey(pem: string): boolean {
    try {
        const trimmed = pem.trim();
        return (
            trimmed.includes('-----BEGIN PUBLIC KEY-----') &&
            trimmed.includes('-----END PUBLIC KEY-----')
        );
    } catch {
        return false;
    }
}

/**
 * Extract the base64-encoded key from PEM format (for display)
 */
export function extractKeyPreview(pem: string): string {
    const b64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s+/g, '');
    return `${b64.substring(0, 20)}...${b64.substring(b64.length - 20)}`;
}
