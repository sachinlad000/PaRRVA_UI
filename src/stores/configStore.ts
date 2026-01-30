import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Environment = 'development' | 'staging' | 'production';

interface ConfigState {
    // Environment settings
    environment: Environment;

    // Auth API (via proxy)
    authBaseUrl: string;
    authPublicKey: string;

    // Data API (via proxy)
    dataBaseUrl: string;
    dataPublicKey: string;

    // UI state
    sidebarCollapsed: boolean;

    // Actions
    setEnvironment: (env: Environment) => void;
    toggleSidebar: () => void;
}

// Public key for Auth API (from Postman authenticate endpoint)
const AUTH_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtCTj4Oo+RbfXCWXuLLMI
MSZVwy6nG4a0T3y5ALW2w7nDCk/SWmd1HMvj6R92Pk8ta1P3HNgmGvWikUMiAOgP
NBe35mT0SUv7mFTcSQeTKnhto7tbr2R+hnwA/7o2Fn1iEqcqNdz4fSSULGaloVv/
amwPVwKH1z0RQgaLjtvBTKwKxP6LUOJnUo0G9BuH0eNHfmG4En9sYZgs4sAyKK1a
6oz+qDYatp2Bv/JRf0Kjnxi7GtiiKhCUWgW5jDIY42Q5D1Gsld8xeUeYYS6A1D/w
u0WqJp1oJ9pEV5D+oRdQotYKQqoTllBaJ4NmsigfNr5a9/3UvDY5F7s7MnYhuMSk
DQIDAQAB
-----END PUBLIC KEY-----`;

// Public key for NSE Data API (from Postman ra/strategy, ia/strategy endpoints)
const DATA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAojQVs6yFZR/Gs46x6wqc
8m1aeaSX3hXHvRDGKeEsJ7/Umb5GmPkUdlximFEPTyhCYSfR4WwtO4B3VaUStX35
JbUoeRwFFuz+z4ZR1Dr1CyKrnLthhcyG7WFxZ1nITXVI32ZTBZFskpcQ/JGO0y/d
9KbuVoLRU2r6IIoK3sfh4FhOkpmnyZA+jbuAU0ayUsjjHvbBcGja0Q3MOLlasxav
lmPWLrUkVV7Gp79p4edONXw81yG6b+WeJhjUqs8M3hxmFJpPA4GfOYze8q0kA++i
eEZIe30L4Te8GwkDYcNk1SBDScVHEcr+pwGoJB4DoCBODvSSzKn4G42z7ZKdmi1p
pQIDAQAB
-----END PUBLIC KEY-----`;

// Use relative URLs for proxy
const getUrls = () => {
    // In production (Cloudflare), use relative paths to the Pages Functions
    // In development, also use relative paths since we'll run with wrangler
    return {
        authBaseUrl: '', // Will be /api/auth/authenticate
        dataBaseUrl: '', // Will be /api/nse/*
    };
};

const urls = getUrls();

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            environment: 'production',
            authBaseUrl: urls.authBaseUrl,
            authPublicKey: AUTH_PUBLIC_KEY,
            dataBaseUrl: urls.dataBaseUrl,
            dataPublicKey: DATA_PUBLIC_KEY,
            sidebarCollapsed: false,

            setEnvironment: (env) => {
                set({ environment: env });
            },

            toggleSidebar: () => {
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
            },
        }),
        {
            name: 'parrva-config',
        }
    )
);
