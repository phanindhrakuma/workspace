import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, googleLogin } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const data = await login(email, password);
                toast.success('Welcome back!');
                navigate(data.user.setupCompleted ? '/' : '/onboarding');
            } else {
                const data = await register(email, password, name);
                toast.success('Account created!');
                navigate('/onboarding');
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            toast.info('Google OAuth requires real credentials. Using demo login.');
            const data = await googleLogin({ email: 'demo@coworkspace.com', name: 'Demo User', googleId: 'demo123' });
            navigate(data.user.setupCompleted ? '/' : '/onboarding');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300 rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl font-bold mb-8">C</div>
                    <h1 className="text-4xl font-bold mb-4">CoWorkSpace</h1>
                    <p className="text-xl text-primary-200 mb-8">Workspace Management System</p>
                    <div className="space-y-4 text-primary-200">
                        <div className="flex items-center gap-3"><span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">✓</span> Manage companies & seats</div>
                        <div className="flex items-center gap-3"><span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">✓</span> Automated GST invoicing</div>
                        <div className="flex items-center gap-3"><span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">✓</span> Meeting room bookings</div>
                        <div className="flex items-center gap-3"><span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">✓</span> Smart reminders & reports</div>
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-surface-50 dark:bg-surface-950">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">C</div>
                        <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">CoWorkSpace</span>
                    </div>

                    <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">{isLogin ? 'Welcome back' : 'Create account'}</h2>
                    <p className="text-surface-500 mb-8">{isLogin ? 'Sign in to your workspace' : 'Get started with your coworking space'}</p>

                    {/* Google button */}
                    <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-surface-200 dark:border-surface-700 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all mb-6">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        <span className="font-medium text-surface-700 dark:text-surface-300">Continue with Google</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700"></div></div>
                        <div className="relative flex justify-center text-xs"><span className="px-3 bg-surface-50 dark:bg-surface-950 text-surface-400">or continue with email</span></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="input-field" required={!isLogin} />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" required minLength={6} />
                        </div>
                        {isLogin && (
                            <div className="flex justify-end">
                                <button type="button" className="text-sm text-primary-500 hover:text-primary-600 font-medium">Forgot password?</button>
                            </div>
                        )}
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-surface-500">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-primary-500 hover:text-primary-600 font-medium">{isLogin ? 'Sign up' : 'Sign in'}</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
