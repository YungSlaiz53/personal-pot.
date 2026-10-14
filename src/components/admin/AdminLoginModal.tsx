import React, { useState } from 'react';
import { X, KeyRound, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-[#080A0E] border border-[#2A121A] rounded-3xl shadow-[0_0_40px_rgba(255,0,60,0.35)] overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#FF003C]/20 blur-3xl pointer-events-none" />

        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-[#1C1217] rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#1C0A10] border border-[#FF003C]/40 flex items-center justify-center text-[#FF003C] mb-3 shadow-[0_0_20px_rgba(255,0,60,0.4)]">
            <KeyRound className="w-7 h-7 text-[#FF003C]" />
          </div>
          <h2 className="text-xl font-black text-[#F8FAFC]">BLESSED DAVID OGLEKWU</h2>
          <p className="text-xs text-slate-400 mt-1">Admin Portal Authentication</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2 relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#FF003C] focus:shadow-[0_0_15px_rgba(255,0,60,0.3)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#FF003C] focus:shadow-[0_0_15px_rgba(255,0,60,0.3)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,60,0.45)] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
