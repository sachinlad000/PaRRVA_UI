import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'RA' | 'IA' | 'TMS';

export interface AdviceType {
    id: string;
    name: string;
    description: string;
    icon: string;
    path: string;
    roles: UserRole[];
}

export const ADVICE_TYPES: AdviceType[] = [
    {
        id: 'strategy',
        name: 'Strategy Advice',
        description: 'Submit investment strategy recommendations',
        icon: '📊',
        path: '/advice/strategy',
        roles: ['RA', 'IA'],
    },
    {
        id: 'singlestock',
        name: 'Single Stock Advice',
        description: 'Submit recommendations for individual stocks',
        icon: '📈',
        path: '/advice/singlestock',
        roles: ['RA', 'IA'],
    },
    {
        id: 'portfolio',
        name: 'Portfolio Advice',
        description: 'Submit portfolio-level recommendations',
        icon: '💼',
        path: '/advice/portfolio',
        roles: ['RA', 'IA'],
    },
    {
        id: 'intraday',
        name: 'Intraday Advice',
        description: 'Submit same-day trading recommendations',
        icon: '⚡',
        path: '/advice/intraday',
        roles: ['RA', 'IA'],
    },
    {
        id: 'derivative',
        name: 'Derivative Advice',
        description: 'Submit derivatives trading recommendations',
        icon: '📉',
        path: '/advice/derivative',
        roles: ['RA', 'IA'],
    },
    {
        id: 'algoinput',
        name: 'Algo Input',
        description: 'Submit algorithmic trading inputs',
        icon: '🤖',
        path: '/advice/algoinput',
        roles: ['TMS'],
    },
];

interface Submission {
    id: string;
    adviceType: string;
    adviceName: string;
    timestamp: number;
    status: 'success' | 'error' | 'pending';
    message?: string;
}

interface AuthState {
    token: string | null;
    role: UserRole | null;
    username: string | null;
    isAuthenticated: boolean;
    tokenExpiry: number | null;
    submissions: Submission[];

    // Actions
    setAuth: (token: string, role: UserRole, username: string) => void;
    logout: () => void;
    isTokenExpired: () => boolean;
    getAvailableAdviceTypes: () => AdviceType[];
    addSubmission: (submission: Submission) => void;
    clearSubmissions: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            role: null,
            username: null,
            isAuthenticated: false,
            tokenExpiry: null,
            submissions: [],

            setAuth: (token, role, username) => {
                // Token expires in 8 hours
                const expiry = Date.now() + 8 * 60 * 60 * 1000;
                set({
                    token,
                    role,
                    username,
                    isAuthenticated: true,
                    tokenExpiry: expiry,
                });
            },

            logout: () => {
                set({
                    token: null,
                    role: null,
                    username: null,
                    isAuthenticated: false,
                    tokenExpiry: null,
                });
            },

            isTokenExpired: () => {
                const { tokenExpiry } = get();
                if (!tokenExpiry) return true;
                return Date.now() > tokenExpiry;
            },

            getAvailableAdviceTypes: () => {
                const { role } = get();
                if (!role) return [];
                return ADVICE_TYPES.filter((advice) => advice.roles.includes(role));
            },

            addSubmission: (submission) => {
                const { submissions } = get();
                set({ submissions: [submission, ...submissions].slice(0, 20) });
            },

            clearSubmissions: () => {
                set({ submissions: [] });
            },
        }),
        {
            name: 'parrva-auth',
            partialize: (state) => ({
                token: state.token,
                role: state.role,
                username: state.username,
                isAuthenticated: state.isAuthenticated,
                tokenExpiry: state.tokenExpiry,
                submissions: state.submissions,
            }),
        }
    )
);
