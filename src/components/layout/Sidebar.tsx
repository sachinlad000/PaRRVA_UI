import { useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Key,
    BarChart3,
    TrendingUp,
    Cpu,
    FileJson,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { ENDPOINTS, getCategories, type ParsedEndpoint } from '../../lib/postman/endpoints';
import { useApiStore } from '../../stores/apiStore';
import { useConfigStore } from '../../stores/configStore';

const categoryIcons: Record<string, React.ReactNode> = {
    auth: <Key className="w-4 h-4" />,
    ra: <BarChart3 className="w-4 h-4" />,
    ia: <TrendingUp className="w-4 h-4" />,
    algo: <Cpu className="w-4 h-4" />,
};

export function Sidebar() {
    const { selectedEndpoint, setSelectedEndpoint } = useApiStore();
    const { sidebarCollapsed, toggleSidebar } = useConfigStore();

    const categories = getCategories();

    const groupedEndpoints = useMemo(() => {
        const groups: Record<string, ParsedEndpoint[]> = {};
        ENDPOINTS.forEach((endpoint) => {
            if (!groups[endpoint.category]) {
                groups[endpoint.category] = [];
            }
            groups[endpoint.category].push(endpoint);
        });
        return groups;
    }, []);

    return (
        <aside
            className={cn(
                'h-full bg-card border-r border-border flex flex-col transition-all duration-300',
                sidebarCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-sm">API Endpoints</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Endpoints List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                {categories.map((category) => (
                    <div key={category.id} className="mb-4">
                        {/* Category Header */}
                        <div
                            className={cn(
                                'flex items-center gap-2 px-2 py-1.5 text-muted-foreground mb-1',
                                sidebarCollapsed && 'justify-center'
                            )}
                        >
                            {categoryIcons[category.id]}
                            {!sidebarCollapsed && (
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    {category.name}
                                </span>
                            )}
                        </div>

                        {/* Endpoints */}
                        {groupedEndpoints[category.id]?.map((endpoint) => (
                            <button
                                key={endpoint.id}
                                onClick={() => setSelectedEndpoint(endpoint)}
                                className={cn(
                                    'sidebar-item w-full',
                                    selectedEndpoint?.id === endpoint.id && 'active',
                                    sidebarCollapsed && 'justify-center px-0'
                                )}
                                title={endpoint.name}
                            >
                                <FileJson className="w-4 h-4 flex-shrink-0" />
                                {!sidebarCollapsed && (
                                    <div className="flex-1 text-left">
                                        <span className="block truncate">{endpoint.name}</span>
                                        {endpoint.requiresAuth && (
                                            <span className="text-xs text-amber-400">🔒 Auth</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            {!sidebarCollapsed && (
                <div className="p-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        {ENDPOINTS.length} endpoints available
                    </p>
                </div>
            )}
        </aside>
    );
}
