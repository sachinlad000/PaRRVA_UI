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

    const { setAuth } = useAuthStore();
    const { authPublicKey, authBaseUrl } = useConfigStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Prepare encrypted payload
            const payload = { username, password, role };
            const encryptedPayload = await prepareEncryptedPayload(payload, authPublicKey, 'object');

            console.log('Sending auth request to:', `${authBaseUrl}/api/parrva/pdc/auth/authenticate`);
            console.log('Encrypted payload:', encryptedPayload);

            // Call auth API
            const response = await fetch(`${authBaseUrl}/api/parrva/pdc/auth/authenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(encryptedPayload),
            });

            const data = await response.json();
            console.log('Auth response:', response.status, data);

            if (response.ok && data.token) {
                setAuth(data.token, role, username);
                navigate('/dashboard');
            } else {
                setError(data.message || `Authentication failed (Status: ${response.status})`);
            }
        } catch (err) {
            console.error('Auth error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            // Check for CORS or network errors
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setError('Unable to connect to server. This may be due to CORS restrictions or network issues. Please check browser console for details.');
            } else {
                setError(`Connection error: ${errorMessage}`);
            }
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

                    {/* API Info */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                        <p><strong>Auth API:</strong> {authBaseUrl}</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Secure connection to NSE &amp; CareEdge
                </p>
            </div>
        </div>
    );
}
