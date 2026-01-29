import { useState } from 'react';
import { Copy, Check, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { useApiStore } from '../../stores/apiStore';

function formatJson(data: unknown): string {
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
}

function JsonHighlight({ json }: { json: string }) {
    // Simple JSON syntax highlighting
    const highlighted = json
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: null/g, ': <span class="json-null">null</span>');

    return (
        <pre
            className="text-sm whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
        />
    );
}

export function ResponseViewer() {
    const { lastResponse, lastError, isLoading } = useApiStore();
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        if (lastResponse?.data) {
            await navigator.clipboard.writeText(formatJson(lastResponse.data));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sending request...</p>
                </div>
            </div>
        );
    }

    if (lastError) {
        return (
            <div className="h-full p-4">
                <div className="flex items-center gap-2 text-destructive mb-4">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-semibold">Request Error</h3>
                </div>
                <div className="code-block">
                    <p className="text-sm text-destructive">{lastError}</p>
                </div>
            </div>
        );
    }

    if (!lastResponse) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-sm">Send a request to see the response</p>
                </div>
            </div>
        );
    }

    const isSuccess = lastResponse.status >= 200 && lastResponse.status < 300;

    return (
        <div className="h-full flex flex-col">
            {/* Response Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isSuccess ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'px-2 py-0.5 rounded font-medium text-sm',
                                    isSuccess
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                )}
                            >
                                {lastResponse.status}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {lastResponse.statusText}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {lastResponse.duration.toFixed(0)}ms
                        </span>
                    </div>
                </div>
                <button
                    onClick={copyToClipboard}
                    className="btn-ghost btn-sm"
                    title="Copy response"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Response Body */}
            <div className="flex-1 p-4 overflow-auto scrollbar-thin">
                <label className="label mb-2">Response Body</label>
                <div className="code-block min-h-[200px]">
                    <JsonHighlight json={formatJson(lastResponse.data)} />
                </div>
            </div>
        </div>
    );
}
