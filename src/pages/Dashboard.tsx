import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AppLayout } from '../components/layout/AppLayout';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
    const navigate = useNavigate();
    const { username, getAvailableAdviceTypes, submissions } = useAuthStore();
    const availableAdvices = getAvailableAdviceTypes();
    const recentSubmissions = submissions.slice(0, 5);

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {username}!
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Select an advice type below to submit your recommendations to NSE.
                    </p>
                </div>

                {/* Advice Cards Grid */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Advice</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableAdvices.map((advice) => (
                            <button
                                key={advice.id}
                                onClick={() => navigate(advice.path)}
                                className="card card-hover p-6 text-left transition-all"
                            >
                                <div className="advice-icon mb-3">{advice.icon}</div>
                                <h3 className="font-semibold text-gray-900 mb-1">{advice.name}</h3>
                                <p className="text-sm text-gray-500">{advice.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Submissions */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
                    {recentSubmissions.length > 0 ? (
                        <div className="card overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {recentSubmissions.map((submission) => (
                                    <div key={submission.id} className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {submission.status === 'success' ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : submission.status === 'error' ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{submission.adviceName}</div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDistanceToNow(submission.timestamp, { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`badge ${submission.status === 'success' ? 'badge-success' :
                                                submission.status === 'error' ? 'badge-error' :
                                                    'badge-warning'
                                            }`}>
                                            {submission.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="card p-8 text-center">
                            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No submissions yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Your submitted advices will appear here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
