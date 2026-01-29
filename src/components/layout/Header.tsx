import { LogOut, User, Globe } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { useConfigStore, type Environment } from '../../stores/configStore';

export function Header() {
    const { username, role, isAuthenticated, logout } = useAuthStore();
    const { environment, setEnvironment } = useConfigStore();

    const environments: { value: Environment; label: string; color: string }[] = [
        { value: 'development', label: 'Development', color: 'text-green-400' },
        { value: 'staging', label: 'Staging', color: 'text-amber-400' },
        { value: 'production', label: 'Production', color: 'text-red-400' },
    ];

    return (
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold gradient-text">Parrva API Tester</h1>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded">
                    NSE India PDC
                </span>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                {/* Environment Selector */}
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value as Environment)}
                        className="bg-secondary border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {environments.map((env) => (
                            <option key={env.value} value={env.value}>
                                {env.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* User Info */}
                {isAuthenticated && (
                    <div className="flex items-center gap-3 pl-4 border-l border-border">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{username}</span>
                            <span
                                className={cn(
                                    'px-1.5 py-0.5 rounded text-xs font-medium',
                                    role === 'RA'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-purple-500/20 text-purple-400'
                                )}
                            >
                                {role}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="btn-ghost btn-sm text-muted-foreground hover:text-destructive"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
