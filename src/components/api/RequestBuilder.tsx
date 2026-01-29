import { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Lock, Unlock, Code, Eye, Loader2, FormInput } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { useApiStore } from '../../stores/apiStore';
import { useAuthStore } from '../../stores/authStore';
import { useConfigStore } from '../../stores/configStore';
import { prepareEncryptedPayload } from '../../lib/crypto/jwe';
import { sendEncryptedRequest } from '../../lib/api/client';
import { EndpointForm } from './EndpointForm';
import type { ParsedEndpoint } from '../../lib/postman/endpoints';

interface Props {
    endpoint: ParsedEndpoint;
}

export function RequestBuilder({ endpoint }: Props) {
    const [activeTab, setActiveTab] = useState<'form' | 'json' | 'encrypted'>('form');
    const [formData, setFormData] = useState<unknown>(null);

    const {
        currentPayload,
        setCurrentPayload,
        encryptedPreview,
        setEncryptedPreview,
        isLoading,
        setLoading,
        setResponse,
        setError,
        addToHistory,
    } = useApiStore();
    const { isAuthenticated } = useAuthStore();
    const { dataPublicKey, authPublicKey, dataBaseUrl, authBaseUrl } = useConfigStore();

    const publicKey = endpoint.category === 'auth' ? authPublicKey : dataPublicKey;
    const baseUrl = endpoint.category === 'auth' ? authBaseUrl : dataBaseUrl;

    // Sync form data to JSON
    useEffect(() => {
        if (formData !== null) {
            try {
                setCurrentPayload(JSON.stringify(formData, null, 2));
            } catch {
                // Ignore serialization errors
            }
        }
    }, [formData, setCurrentPayload]);

    // Generate encrypted preview
    const generatePreview = useCallback(async () => {
        try {
            const parsed = JSON.parse(currentPayload);
            const encrypted = await prepareEncryptedPayload(
                parsed,
                publicKey,
                endpoint.payloadFormat
            );
            setEncryptedPreview(JSON.stringify(encrypted, null, 2));
        } catch (err) {
            setEncryptedPreview(`Error: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
        }
    }, [currentPayload, publicKey, endpoint.payloadFormat, setEncryptedPreview]);

    // Update preview on payload change
    useEffect(() => {
        const timeout = setTimeout(generatePreview, 300);
        return () => clearTimeout(timeout);
    }, [generatePreview]);

    // Load example payload
    const loadExample = () => {
        const example = endpoint.examplePayload;
        setCurrentPayload(JSON.stringify(example, null, 2));
        setFormData(example);
    };

    // Handle form data change
    const handleFormChange = (data: unknown) => {
        setFormData(data);
    };

    // Send request
    const handleSend = async () => {
        setLoading(true);
        setError(null);

        try {
            const parsed = JSON.parse(currentPayload);
            const result = await sendEncryptedRequest(endpoint, parsed);

            setResponse({
                status: result.status,
                statusText: result.statusText,
                data: result.data,
                headers: result.headers,
                duration: result.duration,
            });

            // Add to history
            addToHistory({
                id: Date.now().toString(),
                endpointId: endpoint.id,
                endpointName: endpoint.name,
                timestamp: Date.now(),
                requestPayload: parsed,
                encryptedPayload: result.encryptedPayload,
                response: {
                    status: result.status,
                    statusText: result.statusText,
                    data: result.data,
                    duration: result.duration,
                },
                error: null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Request failed';
            setError(errorMessage);

            addToHistory({
                id: Date.now().toString(),
                endpointId: endpoint.id,
                endpointName: endpoint.name,
                timestamp: Date.now(),
                requestPayload: JSON.parse(currentPayload),
                encryptedPayload: encryptedPreview || '',
                response: null,
                error: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const needsAuth = endpoint.requiresAuth && !isAuthenticated;
    const hasFormSchema = endpoint.fields.length > 0;

    return (
        <div className="flex flex-col h-full">
            {/* Endpoint Info */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">{endpoint.name}</h2>
                    <div className="flex items-center gap-2">
                        {endpoint.requiresAuth ? (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                                <Lock className="w-3 h-3" />
                                Auth Required
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                                <Unlock className="w-3 h-3" />
                                No Auth
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded font-medium">
                        {endpoint.method}
                    </span>
                    <span className="font-mono text-xs truncate">{baseUrl}{endpoint.path}</span>
                </div>
                {endpoint.description && (
                    <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {hasFormSchema && (
                    <button
                        onClick={() => setActiveTab('form')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-sm transition-colors',
                            activeTab === 'form'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <FormInput className="w-4 h-4" />
                        Form
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('json')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm transition-colors',
                        activeTab === 'json'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Code className="w-4 h-4" />
                    JSON
                </button>
                <button
                    onClick={() => setActiveTab('encrypted')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm transition-colors',
                        activeTab === 'encrypted'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Eye className="w-4 h-4" />
                    Encrypted
                </button>
                <div className="flex-1" />
                <button
                    onClick={loadExample}
                    className="btn-ghost btn-sm text-xs mr-2 my-1"
                >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Load Example
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'form' && hasFormSchema ? (
                    <div className="h-full overflow-y-auto scrollbar-thin">
                        <EndpointForm
                            endpoint={endpoint}
                            value={formData || endpoint.examplePayload}
                            onChange={handleFormChange}
                        />
                    </div>
                ) : activeTab === 'json' ? (
                    <div className="h-full flex flex-col p-4">
                        <label className="label mb-2">JSON Payload</label>
                        <textarea
                            value={currentPayload}
                            onChange={(e) => setCurrentPayload(e.target.value)}
                            className="flex-1 input font-mono text-sm resize-none"
                            placeholder="Enter your JSON payload here..."
                            spellCheck={false}
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col p-4">
                        <label className="label mb-2">Encrypted JWE Output (Real-time)</label>
                        <div className="flex-1 code-block overflow-auto scrollbar-thin">
                            <pre className="text-xs whitespace-pre-wrap break-all">
                                {encryptedPreview || 'Enter a valid JSON payload to see encrypted preview'}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border flex items-center justify-between">
                {needsAuth && (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Please login to send this request
                    </p>
                )}
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={handleSend}
                        disabled={isLoading || needsAuth}
                        className="btn-primary"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Request
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
