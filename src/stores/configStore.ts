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

// Public key for Auth API
const AUTH_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuanjcPRoCgOsjeH3Fwpv
XuN3XMTB9VdLX5nzWqhuxiPBGH7CXDwe5LU3RHM0rVMFHBR1HZQ4dFOeCxDYPGzm
V9V5n0FWVymh8PzZZQu9LbiH54KIpoWNL+XiEt1IJPU2JZKn/VPLX0kMQ7aDntqe
8YHOP7gEyAndKMCuDxyBvME8ZnT7FKtLjVsBbQax9YrC9MZJFMNB0ixMoVpqsxey
7xNTxmr9RJmyhQC+fiFqhoNq8wwrSIqfpXlVkYMBf0Hm0K0dPWmrNYwPuziJdYn0
zGVQqupWTreK7bQx+5TqrJOXwT/GCtjxjn6bapvPffLkEy5jwyRaO0t8Q9y/QFXL
WwIDAQAB
-----END PUBLIC KEY-----`;

// Public key for Data API
const DATA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwhxiCDBMrExJDTb0lJOR
YYE3p6p3WqJgJtN8qxDGFQAEsBwVAEAvsNuDWqRKSBAnA2X+/5ZNLJ+JqgOjJHi3
7V66NNp7b67sSGCJw79DF/Th7ikr0h0qJU3X3KXLWP7w8ZWxhhEdJfIlnv3Lbqzy
fMTfxPGviIF6DBdw15E0a3RBMxqzs8MCgNqYZE5Y3xnxXf7TSNpvLXqnhQyKYdM7
vFjhQWV5fVLNRMJqRgCHDyGZEnYBYpbqMeaZYGDMoH+qd4WYKmzhJB3TxKQr+9GH
0LHxw6URaqvfK9mz1DRPq3TwpBSNyCun89LwhTQBJfhvviPoU0sAFLqLKXz2bJQJ
vQIDAQAB
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
