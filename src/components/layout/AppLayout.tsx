import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface Props {
    children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
    const navigate = useNavigate();
    const { username, role, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                                P
                            </div>
                            <span className="font-semibold text-gray-900">Parrva</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{username}</span>
                                <span className={`badge ${role === 'RA' ? 'badge-primary' :
                                        role === 'IA' ? 'badge-success' :
                                            'badge-warning'
                                    }`}>
                                    {role}
                                </span>
                            </div>
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm text-gray-600">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
