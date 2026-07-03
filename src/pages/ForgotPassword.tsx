import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GraduationCap, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GTU Bill System</h1>
          <p className="text-slate-400 text-sm mt-1">External Examiner Bill Generation</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Email Sent</h2>
              <p className="text-slate-600 text-sm mb-6">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>

              <h2 className="text-xl font-semibold text-slate-800 mb-2">Reset your password</h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your email address and we'll send you a reset link.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition text-sm shadow-sm"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Gujarat Technological University, Ahmedabad
        </p>
      </div>
    </div>
  );
}
