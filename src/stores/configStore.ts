import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DATA_PUBLIC_KEY, AUTH_PUBLIC_KEY } from '../lib/postman/endpoints';

export type Environment = 'development' | 'staging' | 'production';

interface ConfigState {
    environment: Environment;
    dataBaseUrl: string;
    authBaseUrl: string;
    dataPublicKey: string;
    authPublicKey: string;
    sidebarCollapsed: boolean;

    // Actions
    setEnvironment: (env: Environment) => void;
    setDataBaseUrl: (url: string) => void;
    setAuthBaseUrl: (url: string) => void;
    setDataPublicKey: (key: string) => void;
    setAuthPublicKey: (key: string) => void;
    toggleSidebar: () => void;
}

const environmentConfigs: Record<Environment, { dataBaseUrl: string; authBaseUrl: string }> = {
    development: {
        dataBaseUrl: 'https://clientprofilinguat.nseindia.com',
        authBaseUrl: 'https://careparrva.com',
    },
    staging: {
        dataBaseUrl: 'https://clientprofilinguat.nseindia.com',
        authBaseUrl: 'https://careparrva.com',
    },
    production: {
        dataBaseUrl: 'https://clientprofiling.nseindia.com',
        authBaseUrl: 'https://careparrva.com',
    },
};

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            environment: 'development',
            dataBaseUrl: environmentConfigs.development.dataBaseUrl,
            authBaseUrl: environmentConfigs.development.authBaseUrl,
            dataPublicKey: DATA_PUBLIC_KEY,
            authPublicKey: AUTH_PUBLIC_KEY,
            sidebarCollapsed: false,

            setEnvironment: (env) => {
                const config = environmentConfigs[env];
                set({
                    environment: env,
                    dataBaseUrl: config.dataBaseUrl,
                    authBaseUrl: config.authBaseUrl,
                });
            },

            setDataBaseUrl: (url) => set({ dataBaseUrl: url }),
            setAuthBaseUrl: (url) => set({ authBaseUrl: url }),
            setDataPublicKey: (key) => set({ dataPublicKey: key }),
            setAuthPublicKey: (key) => set({ authPublicKey: key }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        }),
        {
            name: 'parrva-config',
        }
    )
);
