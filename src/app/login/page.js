"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { setAuthToken } from '@/lib/apiClient';
import { Zap, Mail, Lock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const authError = hashParams.get('error');

        if (authError) {
          setError(`Login failed: ${hashParams.get('error_description') || authError}`);
          return;
        }

        if (accessToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (sessionError) {
            setError(`Session error: ${sessionError.message}`);
            return;
          }

          if (data.session?.access_token) {
            setAuthToken(data.session.access_token);
            router.replace('/dashboard');
            return;
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError(`Auth error: ${exchangeError.message}`);
            return;
          }

          if (data.session?.access_token) {
            setAuthToken(data.session.access_token);
            router.replace('/dashboard');
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAuthToken(session.access_token);
          router.replace('/dashboard');
        }
      } catch (err) {
        setError('Authentication failed');
      }
    };

    restoreSession();
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.session?.access_token) {
          setAuthToken(data.session.access_token);
          router.push('/dashboard');
          return;
        }

        setMessage('Account created. Check your email to confirm.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session?.access_token) {
        setAuthToken(data.session.access_token);
        router.push('/dashboard');
        return;
      }

      setError('Unable to sign in.');
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Job Agent</h1>
            <p className="text-xs text-slate-500">AI Career Pilot</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-sm text-slate-400 mb-6">{mode === 'login' ? 'Sign in to continue' : 'Get started with AI job search'}</p>

          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-white/5 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'login' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500/50 transition-all text-white text-sm"
                  type="email"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500/50 transition-all text-white text-sm"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            {message && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{message}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-white transition-all disabled:opacity-50 text-sm"
            >
              {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-blue-400 font-medium hover:text-blue-300">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
