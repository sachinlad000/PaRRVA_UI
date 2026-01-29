import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ParsedEndpoint } from '../lib/postman/endpoints';

export interface RequestHistoryItem {
    id: string;
    endpointId: string;
    endpointName: string;
    timestamp: number;
    requestPayload: unknown;
    encryptedPayload: string;
    response: {
        status: number;
        statusText: string;
        data: unknown;
        duration: number;
    } | null;
    error: string | null;
}

interface ApiState {
    selectedEndpoint: ParsedEndpoint | null;
    currentPayload: string;
    encryptedPreview: string | null;
    isLoading: boolean;
    lastResponse: {
        status: number;
        statusText: string;
        data: unknown;
        headers: Record<string, string>;
        duration: number;
    } | null;
    lastError: string | null;
    history: RequestHistoryItem[];

    // Actions
    setSelectedEndpoint: (endpoint: ParsedEndpoint | null) => void;
    setCurrentPayload: (payload: string) => void;
    setEncryptedPreview: (preview: string | null) => void;
    setLoading: (loading: boolean) => void;
    setResponse: (response: ApiState['lastResponse']) => void;
    setError: (error: string | null) => void;
    addToHistory: (item: RequestHistoryItem) => void;
    clearHistory: () => void;
    loadFromHistory: (item: RequestHistoryItem) => void;
}

export const useApiStore = create<ApiState>()(
    persist(
        (set, get) => ({
            selectedEndpoint: null,
            currentPayload: '',
            encryptedPreview: null,
            isLoading: false,
            lastResponse: null,
            lastError: null,
            history: [],

            setSelectedEndpoint: (endpoint) => {
                set({
                    selectedEndpoint: endpoint,
                    currentPayload: endpoint ? JSON.stringify(endpoint.examplePayload, null, 2) : '',
                    encryptedPreview: null,
                    lastResponse: null,
                    lastError: null,
                });
            },

            setCurrentPayload: (payload) => set({ currentPayload: payload }),

            setEncryptedPreview: (preview) => set({ encryptedPreview: preview }),

            setLoading: (loading) => set({ isLoading: loading }),

            setResponse: (response) => set({ lastResponse: response, lastError: null }),

            setError: (error) => set({ lastError: error, lastResponse: null }),

            addToHistory: (item) => {
                const { history } = get();
                // Keep last 50 items
                const newHistory = [item, ...history].slice(0, 50);
                set({ history: newHistory });
            },

            clearHistory: () => set({ history: [] }),

            loadFromHistory: (item) => {
                set({
                    currentPayload: JSON.stringify(item.requestPayload, null, 2),
                    encryptedPreview: item.encryptedPayload,
                });
            },
        }),
        {
            name: 'parrva-api',
            partialize: (state) => ({
                history: state.history,
            }),
        }
    )
);
