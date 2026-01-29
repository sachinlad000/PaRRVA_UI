import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAuthStore, ADVICE_TYPES } from '../stores/authStore';
import { useConfigStore } from '../stores/configStore';
import { prepareEncryptedPayload } from '../lib/crypto/jwe';
import { ENDPOINTS } from '../lib/postman/endpoints';
import { AppLayout } from '../components/layout/AppLayout';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'datetime' | 'select';
    required?: boolean;
    placeholder?: string;
    hint?: string;
    options?: { value: string; label: string }[];
}

const ADVICE_FORMS: Record<string, { title: string; description: string; fields: FormField[]; isArray: boolean }> = {
    strategy: {
        title: 'Strategy Advice',
        description: 'Submit investment strategy recommendations to NSE',
        isArray: true,
        fields: [
            { name: 'pan', label: 'Client PAN', type: 'text', required: true, placeholder: 'ABCDE1234F', hint: '10-character PAN number' },
            { name: 'isin', label: 'ISIN', type: 'text', required: true, placeholder: 'INE123456789' },
            {
                name: 'strategyAdvice', label: 'Strategy', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                    { value: 'HOLD', label: 'Hold' },
                ]
            },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: 'Enter quantity' },
            { name: 'price', label: 'Target Price (₹)', type: 'number', required: true, placeholder: 'Enter target price' },
            { name: 'adviceDate', label: 'Advice Date', type: 'date', required: true },
            { name: 'validTill', label: 'Valid Till', type: 'date', required: true },
            { name: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional remarks' },
        ],
    },
    singlestock: {
        title: 'Single Stock Advice',
        description: 'Submit recommendations for individual stocks',
        isArray: true,
        fields: [
            { name: 'pan', label: 'Client PAN', type: 'text', required: true, placeholder: 'ABCDE1234F' },
            { name: 'symbol', label: 'Stock Symbol', type: 'text', required: true, placeholder: 'e.g., RELIANCE' },
            { name: 'series', label: 'Series', type: 'text', required: true, placeholder: 'EQ' },
            {
                name: 'advice', label: 'Recommendation', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                    { value: 'HOLD', label: 'Hold' },
                ]
            },
            { name: 'targetPrice', label: 'Target Price (₹)', type: 'number', required: true },
            { name: 'stopLoss', label: 'Stop Loss (₹)', type: 'number', placeholder: 'Optional' },
            { name: 'adviceDate', label: 'Advice Date', type: 'date', required: true },
            { name: 'validTill', label: 'Valid Till', type: 'date', required: true },
        ],
    },
    portfolio: {
        title: 'Portfolio Advice',
        description: 'Submit portfolio-level recommendations',
        isArray: true,
        fields: [
            { name: 'pan', label: 'Client PAN', type: 'text', required: true, placeholder: 'ABCDE1234F' },
            { name: 'portfolioName', label: 'Portfolio Name', type: 'text', required: true },
            {
                name: 'action', label: 'Action', type: 'select', required: true, options: [
                    { value: 'REBALANCE', label: 'Rebalance' },
                    { value: 'ENTRY', label: 'Entry' },
                    { value: 'EXIT', label: 'Exit' },
                ]
            },
            { name: 'allocationPercentage', label: 'Allocation %', type: 'number', required: true, placeholder: '0-100' },
            { name: 'adviceDate', label: 'Advice Date', type: 'date', required: true },
            { name: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional remarks' },
        ],
    },
    intraday: {
        title: 'Intraday Advice',
        description: 'Submit same-day trading recommendations',
        isArray: true,
        fields: [
            { name: 'pan', label: 'Client PAN', type: 'text', required: true, placeholder: 'ABCDE1234F' },
            { name: 'symbol', label: 'Stock Symbol', type: 'text', required: true, placeholder: 'e.g., NIFTY' },
            {
                name: 'advice', label: 'Direction', type: 'select', required: true, options: [
                    { value: 'LONG', label: 'Long (Buy)' },
                    { value: 'SHORT', label: 'Short (Sell)' },
                ]
            },
            { name: 'entryPrice', label: 'Entry Price (₹)', type: 'number', required: true },
            { name: 'targetPrice', label: 'Target Price (₹)', type: 'number', required: true },
            { name: 'stopLoss', label: 'Stop Loss (₹)', type: 'number', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
            { name: 'adviceTime', label: 'Advice Time', type: 'datetime', required: true },
        ],
    },
    derivative: {
        title: 'Derivative Advice',
        description: 'Submit derivatives trading recommendations',
        isArray: true,
        fields: [
            { name: 'pan', label: 'Client PAN', type: 'text', required: true, placeholder: 'ABCDE1234F' },
            { name: 'symbol', label: 'Underlying', type: 'text', required: true, placeholder: 'e.g., NIFTY' },
            {
                name: 'optionType', label: 'Option Type', type: 'select', required: true, options: [
                    { value: 'CE', label: 'Call (CE)' },
                    { value: 'PE', label: 'Put (PE)' },
                    { value: 'FUT', label: 'Futures' },
                ]
            },
            { name: 'strikePrice', label: 'Strike Price', type: 'number', required: true },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
            {
                name: 'advice', label: 'Action', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                ]
            },
            { name: 'lots', label: 'No. of Lots', type: 'number', required: true },
            { name: 'targetPrice', label: 'Target Premium (₹)', type: 'number', required: true },
        ],
    },
    algoinput: {
        title: 'Algo Input',
        description: 'Submit algorithmic trading inputs',
        isArray: true,
        fields: [
            { name: 'algoId', label: 'Algorithm ID', type: 'text', required: true },
            { name: 'symbol', label: 'Symbol', type: 'text', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
            {
                name: 'orderType', label: 'Order Type', type: 'select', required: true, options: [
                    { value: 'MARKET', label: 'Market' },
                    { value: 'LIMIT', label: 'Limit' },
                ]
            },
            { name: 'price', label: 'Limit Price (₹)', type: 'number', placeholder: 'Required for limit orders' },
            { name: 'triggerTime', label: 'Trigger Time', type: 'datetime', required: true },
        ],
    },
};

export function AdvicePage() {
    const navigate = useNavigate();
    const { adviceType } = useParams<{ adviceType: string }>();
    const { token, role, addSubmission } = useAuthStore();
    const { dataPublicKey, dataBaseUrl } = useConfigStore();

    const [items, setItems] = useState<Record<string, string | number>[]>([{}]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

    const formConfig = adviceType ? ADVICE_FORMS[adviceType] : null;
    const adviceInfo = ADVICE_TYPES.find(a => a.id === adviceType);

    if (!formConfig || !adviceInfo) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <p className="text-gray-500">Advice type not found</p>
                </div>
            </AppLayout>
        );
    }

    const addItem = () => {
        setItems([...items, {}]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            // Find the matching endpoint
            const endpoint = ENDPOINTS.find(ep => ep.id.includes(adviceType!) && ep.category === role?.toLowerCase());
            const path = endpoint?.path || `/api/parrva/pdc/${role?.toLowerCase()}/${adviceType}`;
            const url = `${dataBaseUrl}${path}`;

            // Prepare encrypted payload
            const payload = formConfig.isArray ? items : items[0];
            const encryptedPayload = await prepareEncryptedPayload(payload, dataPublicKey, formConfig.isArray ? 'array' : 'object');

            console.log('Sending advice to:', url);
            console.log('Payload:', payload);
            console.log('Encrypted payload:', encryptedPayload);

            // Submit to NSE
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(encryptedPayload),
            });

            const data = await response.json();
            console.log('Response:', response.status, data);

            if (response.ok) {
                setSubmitResult({ success: true, message: data.message || 'Advice submitted successfully!' });
                addSubmission({
                    id: Date.now().toString(),
                    adviceType: adviceType!,
                    adviceName: formConfig.title,
                    timestamp: Date.now(),
                    status: 'success',
                });
                // Reset form after success
                setTimeout(() => {
                    setItems([{}]);
                    setSubmitResult(null);
                }, 3000);
            } else {
                throw new Error(data.message || `Submission failed (Status: ${response.status})`);
            }
        } catch (err) {
            console.error('Submission error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            let displayError = errorMessage;
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                displayError = 'Unable to connect to NSE server. This may be due to CORS restrictions or network issues.';
            }

            setSubmitResult({ success: false, message: displayError });
            addSubmission({
                id: Date.now().toString(),
                adviceType: adviceType!,
                adviceName: formConfig.title,
                timestamp: Date.now(),
                status: 'error',
                message: displayError,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            {/* Subheader */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm mb-3 -ml-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900">{formConfig.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">{formConfig.description}</p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit}>
                    {items.map((item, itemIndex) => (
                        <div key={itemIndex} className="card p-6 mb-4">
                            {formConfig.isArray && items.length > 1 && (
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                    <span className="font-medium text-gray-700">Entry {itemIndex + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(itemIndex)}
                                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Remove
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {formConfig.fields.map((field) => (
                                    <div key={field.name} className={`form-group ${field.name === 'remarks' ? 'sm:col-span-2' : ''}`}>
                                        <label className="label">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {field.type === 'select' ? (
                                            <select
                                                value={item[field.name] || ''}
                                                onChange={(e) => updateItem(itemIndex, field.name, e.target.value)}
                                                className="select"
                                                required={field.required}
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type === 'datetime' ? 'datetime-local' : field.type}
                                                value={item[field.name] || ''}
                                                onChange={(e) => updateItem(itemIndex, field.name,
                                                    field.type === 'number' ? Number(e.target.value) : e.target.value
                                                )}
                                                className="input"
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                step={field.type === 'number' ? 'any' : undefined}
                                            />
                                        )}

                                        {field.hint && <p className="label-hint">{field.hint}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Add More Button */}
                    {formConfig.isArray && (
                        <button
                            type="button"
                            onClick={addItem}
                            className="btn btn-secondary w-full mb-6"
                        >
                            <Plus className="w-4 h-4" />
                            Add Another Entry
                        </button>
                    )}

                    {/* Result Message */}
                    {submitResult && (
                        <div className={`alert mb-4 ${submitResult.success ? 'alert-success' : 'alert-error'}`}>
                            {submitResult.success ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span>{submitResult.message}</span>
                        </div>
                    )}

                    {/* API Endpoint Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                        <p><strong>API:</strong> {dataBaseUrl}/api/parrva/pdc/{role?.toLowerCase()}/{adviceType}</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary btn-lg w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit to NSE
                            </>
                        )}
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
