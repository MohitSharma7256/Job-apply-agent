"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { setAuthToken } from '@/lib/apiClient';
import { Key, User, Mail, Lock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSessionFromUrl();
        if (error && !error.message.includes('No auth session')) {
          setError(error.message);
          return;
        }

        const session = data?.session || (await supabase.auth.getSession()).data?.session;
        if (session?.access_token) {
          setAuthToken(session.access_token);
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('OAuth restore error:', err);
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.session?.access_token) {
          setAuthToken(data.session.access_token);
          router.push('/dashboard');
          return;
        }

        setMessage('Account created. Please check your email to confirm your address.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session?.access_token) {
        setAuthToken(data.session.access_token);
        router.push('/dashboard');
        return;
      }

      setError('Unable to sign in. Please try again.');
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[40px] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-slate-400 mt-1">Secure access to your Job Apply Agent workspace.</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 rounded-3xl px-5 py-3 font-bold text-sm ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 rounded-3xl px-5 py-3 font-bold text-sm ${mode === 'register' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <label className="block text-slate-300 text-sm">
              <span className="font-semibold">Full name</span>
              <div className="mt-2 relative rounded-3xl bg-white/5 border border-white/10 focus-within:border-blue-500/60">
                <User className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-3xl bg-transparent px-12 py-4 text-white outline-none"
                  placeholder="Your Name"
                  required
                />
              </div>
            </label>
          )}

          <label className="block text-slate-300 text-sm">
            <span className="font-semibold">Email address</span>
            <div className="mt-2 relative rounded-3xl bg-white/5 border border-white/10 focus-within:border-blue-500/60">
              <Mail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-3xl bg-transparent px-12 py-4 text-white outline-none"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label className="block text-slate-300 text-sm">
            <span className="font-semibold">Password</span>
            <div className="mt-2 relative rounded-3xl bg-white/5 border border-white/10 focus-within:border-blue-500/60">
              <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl bg-transparent px-12 py-4 text-white outline-none"
                type="password"
                placeholder="Strong password"
                required
              />
            </div>
          </label>

          {error && <div className="rounded-3xl bg-red-500/10 border border-red-500/20 p-4 text-red-200">{error}</div>}
          {message && <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-200">{message}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-3xl bg-blue-600 px-6 py-4 font-black text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            {isLoading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>

          <div className="mt-6 text-center">
            <div className="relative py-4">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <span className="relative bg-slate-950 px-3 text-xs uppercase tracking-[0.28em] text-slate-500">Or continue with</span>
            </div>
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-slate-200 transition-all hover:border-blue-500/40 hover:bg-white/10"
            >
              Continue with Google
            </button>
          </div>
        </form>

        <div className="mt-8 text-sm text-slate-500">
          <p>
            {mode === 'login'
              ? 'Need an account?'
              : 'Already have an account?'}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 font-bold text-white underline"
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
