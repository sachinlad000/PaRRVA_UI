import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAuthStore, ADVICE_TYPES } from '../stores/authStore';
import { useConfigStore } from '../stores/configStore';
import { prepareEncryptedPayload } from '../lib/crypto/jwe';
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

interface NestedFormConfig {
    title: string;
    description: string;
    isArray: boolean;
    hasNestedArray?: boolean;
    nestedArrayName?: string;
    mainFields: FormField[];
    nestedFields?: FormField[];
}

const ADVICE_FORMS: Record<string, NestedFormConfig> = {
    strategy: {
        title: 'Strategy Advice',
        description: 'Submit derivative strategy recommendations to NSE',
        isArray: true,
        hasNestedArray: true,
        nestedArrayName: 'strategyDetails',
        mainFields: [
            { name: 'adviceName', label: 'Advice Name', type: 'text', required: true, placeholder: 'e.g., Nifty09Jan23600PE' },
            {
                name: 'exchange', label: 'Exchange', type: 'select', required: true, options: [
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                ]
            },
            {
                name: 'strategyName', label: 'Strategy Name', type: 'select', required: true, options: [
                    { value: 'LONG', label: 'Long' },
                    { value: 'SHORT', label: 'Short' },
                    { value: 'STRADDLE', label: 'Straddle' },
                    { value: 'STRANGLE', label: 'Strangle' },
                ]
            },
            {
                name: 'isIntraday', label: 'Is Intraday?', type: 'select', required: true, options: [
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                ]
            },
        ],
        nestedFields: [
            {
                name: 'recommendationType', label: 'Recommendation', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                ]
            },
            { name: 'derivativeName', label: 'Derivative Name', type: 'text', required: true, placeholder: 'e.g., Nifty09Jan23600P' },
            {
                name: 'derivativeType', label: 'Derivative Type', type: 'select', required: true, options: [
                    { value: 'OPT', label: 'Option' },
                    { value: 'FUT', label: 'Futures' },
                ]
            },
            {
                name: 'derivativeOptionType', label: 'Option Type', type: 'select', options: [
                    { value: 'CE', label: 'Call (CE)' },
                    { value: 'PE', label: 'Put (PE)' },
                ]
            },
            { name: 'derivativeOptionStrikePrice', label: 'Strike Price', type: 'text', required: true, placeholder: '23600' },
            { name: 'derivativeExpiryDt', label: 'Expiry Date', type: 'date', required: true },
            { name: 'derivativeQuantity', label: 'Quantity', type: 'number', required: true, placeholder: '1' },
            { name: 'derivativeLotSize', label: 'Lot Size', type: 'number', required: true, placeholder: '75' },
            { name: 'derivativeEntryDttm', label: 'Entry Date/Time', type: 'datetime', required: true },
            { name: 'derivativeEntryPrice', label: 'Entry Price (₹)', type: 'number', required: true },
            { name: 'derivativeTargetPrice', label: 'Target Price (₹)', type: 'number', required: true },
            { name: 'derivativeStopLoss', label: 'Stop Loss (₹)', type: 'number', required: true },
            { name: 'derivativeTotalMargin', label: 'Total Margin (₹)', type: 'number', required: true },
        ],
    },
    singlestock: {
        title: 'Single Stock Advice',
        description: 'Submit short-term stock recommendations',
        isArray: true,
        mainFields: [
            { name: 'adviceName', label: 'Advice Name', type: 'text', required: true, placeholder: 'e.g., HONDAPOWER01' },
            {
                name: 'exchange', label: 'Exchange', type: 'select', required: true, options: [
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                ]
            },
            {
                name: 'shortTermRecommendationType', label: 'Recommendation', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                ]
            },
            { name: 'shortTermStockName', label: 'Stock Name', type: 'text', required: true, placeholder: 'e.g., HONDAPOWER' },
            { name: 'shortTermIsin', label: 'ISIN', type: 'text', required: true, placeholder: 'e.g., INE634A01018' },
            { name: 'shortTermHorizon', label: 'Horizon (Days)', type: 'number', required: true, placeholder: '30' },
            { name: 'shortTermEntryDt', label: 'Entry Date/Time', type: 'datetime', required: true },
            { name: 'shortTermEntryPrice', label: 'Entry Price (₹)', type: 'number', required: true },
            { name: 'shortTermTargetPrice', label: 'Target Price (₹)', type: 'number', required: true },
            { name: 'shortTermSlPrice', label: 'Stop Loss Price (₹)', type: 'number', required: true },
        ],
    },
    portfolio: {
        title: 'Portfolio Advice',
        description: 'Submit model portfolio recommendations',
        isArray: true,
        hasNestedArray: true,
        nestedArrayName: 'details',
        mainFields: [
            { name: 'portfolioName', label: 'Portfolio Name', type: 'text', required: true, placeholder: 'e.g., PortfolioTest1' },
            {
                name: 'portfolioType', label: 'Portfolio Type', type: 'select', required: true, options: [
                    { value: 'Equity', label: 'Equity' },
                    { value: 'Debt', label: 'Debt' },
                    { value: 'Hybrid', label: 'Hybrid' },
                ]
            },
            {
                name: 'stopPortfolio', label: 'Stop Portfolio?', type: 'select', required: true, options: [
                    { value: 'No', label: 'No' },
                    { value: 'Yes', label: 'Yes' },
                ]
            },
        ],
        nestedFields: [
            { name: 'securityName', label: 'Security Name', type: 'text', required: true, placeholder: 'e.g., SENCO' },
            { name: 'isinNo', label: 'ISIN Number', type: 'text', required: true, placeholder: 'e.g., INE602W01027' },
            {
                name: 'exchange', label: 'Exchange', type: 'select', required: true, options: [
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                ]
            },
            { name: 'weightage', label: 'Weightage (0-1)', type: 'number', required: true, placeholder: '0.25', hint: 'Enter value between 0 and 1' },
            {
                name: 'isMutualFund', label: 'Is Mutual Fund?', type: 'select', required: true, options: [
                    { value: 'N', label: 'No' },
                    { value: 'Y', label: 'Yes' },
                ]
            },
        ],
    },
    intraday: {
        title: 'Intraday Advice',
        description: 'Submit intraday/technical call recommendations',
        isArray: true,
        mainFields: [
            { name: 'adviceName', label: 'Advice Name', type: 'text', required: true, placeholder: 'e.g., HINDUNILVR01' },
            { name: 'techCallId', label: 'Technical Call ID', type: 'text', required: true, placeholder: 'e.g., HINDUNILVR' },
            {
                name: 'exchange', label: 'Exchange', type: 'select', required: true, options: [
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                ]
            },
            {
                name: 'techCallType', label: 'Call Type', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                ]
            },
            { name: 'isin', label: 'ISIN', type: 'text', required: true, placeholder: 'e.g., INE030A01027' },
            { name: 'securityEntryDt', label: 'Entry Date/Time', type: 'datetime', required: true },
            { name: 'techCallEntryPrice', label: 'Entry Price (₹)', type: 'number', required: true },
            { name: 'techCallTargetPrice', label: 'Target Price (₹)', type: 'number', required: true },
            { name: 'techCallStopLoss', label: 'Stop Loss (₹)', type: 'number', required: true },
            { name: 'techCallExitDate', label: 'Exit Date/Time', type: 'datetime' },
            { name: 'techCallExitPrice', label: 'Exit Price (₹)', type: 'number' },
            { name: 'note', label: 'Note', type: 'text', placeholder: 'Optional notes' },
        ],
    },
    derivative: {
        title: 'Derivative Advice',
        description: 'Submit derivatives trading recommendations',
        isArray: true,
        mainFields: [
            { name: 'adviceName', label: 'Advice Name', type: 'text', required: true, placeholder: 'e.g., AXISBANK001' },
            {
                name: 'exchange', label: 'Exchange', type: 'select', required: true, options: [
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                ]
            },
            {
                name: 'recommendationType', label: 'Recommendation', type: 'select', required: true, options: [
                    { value: 'BUY', label: 'Buy' },
                    { value: 'SELL', label: 'Sell' },
                ]
            },
            { name: 'derivativeName', label: 'Derivative Name', type: 'text', required: true, placeholder: 'e.g., ADANIENT' },
            {
                name: 'derivativeType', label: 'Derivative Type', type: 'select', required: true, options: [
                    { value: 'OPT', label: 'Option' },
                    { value: 'FUT', label: 'Futures' },
                ]
            },
            {
                name: 'derivativeOptionType', label: 'Option Type', type: 'select', options: [
                    { value: 'CE', label: 'Call (CE)' },
                    { value: 'PE', label: 'Put (PE)' },
                ]
            },
            { name: 'derivativeOptionStrikePrice', label: 'Strike Price', type: 'text', required: true, placeholder: '2500' },
            { name: 'derivativeExpiryDt', label: 'Expiry Date', type: 'date', required: true },
            { name: 'derivativeEntryDttm', label: 'Entry Date/Time', type: 'datetime', required: true },
            { name: 'derivativeEntryPrice', label: 'Entry Price (₹)', type: 'number', required: true },
            { name: 'derivativeQuantity', label: 'Quantity', type: 'number', required: true, placeholder: '1' },
            { name: 'derivativeTargetPrice', label: 'Target Price (₹)', type: 'number', required: true },
            { name: 'derivativeStopLoss', label: 'Stop Loss (₹)', type: 'number', required: true },
            { name: 'derivativeTotalMargin', label: 'Total Margin (₹)', type: 'number', required: true },
            {
                name: 'isIntraday', label: 'Is Intraday?', type: 'select', required: true, options: [
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                ]
            },
        ],
    },
    algoinput: {
        title: 'Algo Input',
        description: 'Submit algorithmic trading inputs (TMS)',
        isArray: true,
        mainFields: [
            {
                name: 'exchange', label: 'Exchange', type: 'select', required: true, options: [
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                ]
            },
            { name: 'tradingMember', label: 'Trading Member', type: 'text', required: true, placeholder: 'e.g., 118999' },
            { name: 'algoId', label: 'Algorithm ID', type: 'text', required: true, placeholder: 'e.g., 695399' },
            { name: 'uniqueClientCode', label: 'Unique Client Code', type: 'text', required: true, placeholder: 'e.g., MKS099' },
            {
                name: 'segment', label: 'Segment', type: 'select', required: true, options: [
                    { value: 'CM', label: 'Cash Market (CM)' },
                    { value: 'FO', label: 'F&O (FO)' },
                ]
            },
            { name: 'fixedCapital', label: 'Fixed Capital (₹)', type: 'number', required: true, placeholder: 'e.g., 19520940' },
        ],
    },
};


export function AdvicePage() {
    const navigate = useNavigate();
    const { adviceType } = useParams<{ adviceType: string }>();
    const { token, role, addSubmission } = useAuthStore();
    const { dataPublicKey } = useConfigStore();

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

    const [debugInfo, setDebugInfo] = useState<{ plainText: string; encrypted: string } | null>(null);

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
            // Build proxy path: /api/nse/{role}/{adviceType}
            const proxyPath = `/api/nse/${role?.toLowerCase()}/${adviceType}`;

            // Prepare encrypted payload
            const payload = formConfig.isArray ? items : items[0];
            const encryptedPayload = await prepareEncryptedPayload(payload, dataPublicKey, formConfig.isArray ? 'array' : 'object');

            // Store debug info
            setDebugInfo({
                plainText: JSON.stringify(payload, null, 2),
                encrypted: JSON.stringify(encryptedPayload, null, 2)
            });

            console.log('Sending advice to proxy:', proxyPath);
            console.log('Payload:', payload);
            console.log('Encrypted payload:', encryptedPayload);

            // Submit via proxy
            const response = await fetch(proxyPath, {
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
                throw new Error(data.message || data.error || `Submission failed (Status: ${response.status})`);
            }
        } catch (err) {
            console.error('Submission error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            setSubmitResult({ success: false, message: errorMessage });
            addSubmission({
                id: Date.now().toString(),
                adviceType: adviceType!,
                adviceName: formConfig.title,
                timestamp: Date.now(),
                status: 'error',
                message: errorMessage,
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
                                {formConfig.mainFields.map((field) => (
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

                {/* Debug Info */}
                {debugInfo && (
                    <div className="mt-8 space-y-4">
                        <div className="card p-4 bg-gray-50 border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                                <span className="mr-2">📝</span> Plain Text Payload
                            </h3>
                            <pre className="bg-white p-3 rounded text-xs overflow-x-auto text-gray-800 border border-gray-100">{debugInfo.plainText}</pre>
                        </div>
                        <div className="card p-4 bg-gray-50 border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                                <span className="mr-2">🔐</span> Encrypted JWE Payload
                            </h3>
                            <pre className="bg-white p-3 rounded text-xs overflow-x-auto text-gray-800 max-h-40 overflow-y-auto border border-gray-100">{debugInfo.encrypted}</pre>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
