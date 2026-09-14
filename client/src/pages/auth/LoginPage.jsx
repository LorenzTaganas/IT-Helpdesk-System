import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Monitor, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // After login, go to where they were trying to go, or dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic frontend validation
    if (!email.trim()) return setError('Email is required.');
    if (!password) return setError('Password is required.');

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill demo credentials
  const fillDemo = (role) => {
    const credentials = {
      superadmin: { email: 'superadmin@itflow.local', password: 'Admin@123' },
      admin:      { email: 'admin@itflow.local',      password: 'Admin@123' },
      support:    { email: 'support@itflow.local',    password: 'Support@123' },
      employee:   { email: 'employee@itflow.local',   password: 'Employee@123' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
    setError('');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

      {/* ── Left Panel: Branding ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        {/* Background grid decoration */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Monitor size={24} color="#fff" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ITFlow</h1>
              <p className="text-xs text-slate-400">IT Helpdesk & Asset Management</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Streamline Your<br />
            <span style={{ color: '#60a5fa' }}>IT Operations</span>
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            A centralized platform for managing IT support tickets, assets,
            and service requests — all in one place.
          </p>

          {/* Feature highlights */}
          {[
            { label: 'Ticket Management', desc: 'Track and resolve issues efficiently' },
            { label: 'Asset Tracking', desc: 'Manage hardware and software inventory' },
            { label: 'Role-Based Access', desc: 'Secure access for all team members' },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-3 mb-4">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#2563eb' }} />
              <div>
                <p className="text-white font-medium text-sm">{f.label}</p>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Login Form ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Monitor size={20} color="#fff" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ITFlow</h1>
              <p className="text-xs text-slate-400">IT Helpdesk & Asset Management</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Sign In</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your credentials to access the system.</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@itflow.local"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
                style={{
                  background: loading ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <span className="text-xs text-slate-500">Demo Accounts</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'superadmin', label: 'Super Admin' },
                  { key: 'admin', label: 'IT Admin' },
                  { key: 'support', label: 'IT Support' },
                  { key: 'employee', label: 'Employee' },
                ].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => fillDemo(d.key)}
                    className="text-xs py-2 px-3 rounded-lg transition-all text-center"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(37,99,235,0.2)';
                      e.target.style.color = '#93c5fd';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                      e.target.style.color = '#94a3b8';
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                Click a role to auto-fill credentials
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            ITFlow — Portfolio Project · For Demonstration Purposes Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
