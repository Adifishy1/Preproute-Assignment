import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Zap, LogIn, Wifi, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import axios from 'axios';

interface LoginForm { userId: string; password: string; }

const BASE = 'https://admin-moderator-backend-staging.up.railway.app/api';

// Warm up the DB by sending a request that fails validation fast
// (bad payload = server validates → hits no DB → returns 400 instantly)
// A second later, send the real credentials — DB is now awake
const warmupDB = () =>
  axios.post(BASE + '/auth/login', { userId: '' }, { timeout: 5000 }).catch(() => {});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'warming' | 'signing'>('idle');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);

    // Phase 1: send a bad request — wakes the DB connection pool, returns in <500ms
    setPhase('warming');
    await warmupDB();

    // Phase 2: wait 1.5s for DB pool to stabilise, then send real credentials
    await new Promise(r => setTimeout(r, 1500));
    setPhase('signing');

    try {
      const res = await axios.post(
        BASE + '/auth/login',
        { userId: data.userId, password: data.password },
        { timeout: 30000 }
      );

      if (res.data.status === 'success' && res.data.data?.token) {
        setAuth(res.data.data.token, res.data.data.user);
        toast.success('Welcome, ' + (res.data.data.user?.name || data.userId) + '!');
        navigate('/dashboard');
      } else {
        toast.error(res.data.message || 'Login failed');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('DB is still waking up — please try clicking Sign In once more');
      } else {
        toast.error(err.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
      setPhase('idle');
    }
  };

  const phaseLabel = {
    idle: 'Sign In',
    warming: 'Waking server…',
    signing: 'Signing in…',
  }[phase];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.08)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.05)' }} />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-4"
            style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight">Preproute</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Test Management Platform
          </p>
        </div>

        {/* Warm-up progress indicator */}
        {phase !== 'idle' && (
          <div className="mb-4 px-4 py-3 rounded-lg animate-slide-up"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div className="flex items-center gap-3 mb-2">
              {phase === 'warming'
                ? <Wifi size={15} style={{ color: '#818cf8' }} className="animate-pulse" />
                : <CheckCircle2 size={15} style={{ color: '#34d399' }} />}
              <p className="text-sm font-medium" style={{ color: '#a5b4fc' }}>
                {phase === 'warming' ? 'Waking staging server…' : 'Server ready — signing in…'}
              </p>
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-1 rounded-full transition-all duration-1000"
                style={{
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                  width: phase === 'warming' ? '45%' : '90%',
                }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="glass p-7">
          <h2 className="font-display font-semibold text-xl text-white mb-6">Sign in to continue</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">User ID</label>
              <input
                className="input-field"
                placeholder="Enter your user ID"
                autoComplete="username"
                disabled={loading}
                {...register('userId', { required: 'User ID is required' })}
              />
              {errors.userId && (
                <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? <Spinner size={16} /> : <LogIn size={16} />}
              {phaseLabel}
            </button>
          </form>

          {/* Note about staging */}
          <div className="mt-4 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ⚡ Staging server — first login may take 5–10 seconds while the DB wakes up.
            </p>
          </div>

          {/* Demo creds */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-center mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Test credentials
            </p>
            <div className="glass-sm px-3 py-2 font-mono text-xs space-y-0.5"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>user: </span>vedant-admin</div>
              <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>pass: </span>vedant123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;