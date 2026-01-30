import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, type UserRole } from '../../stores/authStore';
import { useConfigStore } from '../../stores/configStore';
import { prepareEncryptedPayload } from '../../lib/crypto/jwe';

export function LoginForm() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('RA');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<{ plainText: string; encrypted: string } | null>(null);

    const { setAuth } = useAuthStore();
    const { authPublicKey } = useConfigStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setDebugInfo(null);

        try {
            // Prepare encrypted payload
            const payload = { username, password, role };
            const encryptedPayload = await prepareEncryptedPayload(payload, authPublicKey, 'object');

            // Store debug info
            setDebugInfo({
                plainText: JSON.stringify(payload, null, 2),
                encrypted: JSON.stringify(encryptedPayload, null, 2)
            });

            // Call auth API via proxy
            const proxyUrl = '/api/auth/authenticate';
            console.log('Plain text payload:', payload);
            console.log('Sending auth request to proxy:', proxyUrl);
            console.log('Encrypted payload:', encryptedPayload);

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(encryptedPayload),
            });

            const data = await response.json();
            console.log('Auth response:', response.status, data);

            // Check for JWE in response - this is the token for subsequent calls
            // Response can be { data: "jwe" } or { jwe: "..." } or { token: "..." }
            // IMPORTANT: Must be a non-empty string (not empty object {})
            const possibleToken = data.data.jwe;
            const jweToken = typeof possibleToken === 'string' && possibleToken.length > 0 ? possibleToken : null;

            // Check for status field - must be "success" to proceed
            const statusValue = data.status?.toLowerCase?.() || '';
            const isStatusSuccess = statusValue === 'success';

            // Check for error messages in response
            const hasError = data.messages && data.messages.length > 0;
            const errorMessage = hasError
                ? data.messages.map((m: { errcode?: string; message?: string }) => m.message || m.errcode || 'Error').join(', ')
                : data.message || data.error;

            console.log('Auth check - status:', data.status, 'isSuccess:', isStatusSuccess, 'hasToken:', !!jweToken);

            if (isStatusSuccess && jweToken && !hasError) {
                console.log('Auth successful! Status is success and JWE token received');
                setAuth(jweToken, role, username);
                navigate('/dashboard');
            } else {
                console.error('Auth failed - status:', data.status, 'hasToken:', !!jweToken, 'hasError:', hasError);
                const errorMsg = errorMessage || (!isStatusSuccess ? `Authentication failed: Status is "${data.status || 'missing'}"` : 'Authentication failed');
                setError(errorMsg);
            }
        } catch (err) {
            console.error('Auth error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Connection error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = [
        { value: 'RA', label: 'Research Analyst', description: 'Submit research-based recommendations' },
        { value: 'IA', label: 'Investment Advisor', description: 'Submit investment advice to clients' },
        { value: 'TMS', label: 'Trading Member', description: 'Submit algorithmic trading inputs' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">
                        P
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Parrva</h1>
                    <p className="text-gray-600 mt-1">NSE Advice Submission System</p>
                </div>

                {/* Login Card */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Username */}
                        <div className="form-group">
                            <label className="label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pr-10"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="label">Select Your Role</label>
                            <div className="space-y-2">
                                {roleOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${role === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={option.value}
                                            checked={role === option.value}
                                            onChange={(e) => setRole(e.target.value as UserRole)}
                                            className="mt-1 mr-3"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{option.label}</div>
                                            <div className="text-sm text-gray-500">{option.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="alert alert-error mb-4">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !username || !password}
                            className="btn btn-primary w-full btn-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Debug Info */}
                {debugInfo && (
                    <div className="mt-4 space-y-3">
                        <div className="card p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">📝 Plain Text Body:</h3>
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto text-gray-800">{debugInfo.plainText}</pre>
                        </div>
                        <div className="card p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">🔐 Encrypted Payload:</h3>
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto text-gray-800 max-h-32 overflow-y-auto">{debugInfo.encrypted}</pre>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Secure connection to NSE &amp; CareEdge
                </p>
            </div>
        </div>
    );
}
