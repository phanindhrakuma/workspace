import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

const STEPS = ['Space Details', 'Bank & Tax', 'Confirmation'];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const { refreshUser } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        spaceName: '', gstNumber: '', panNumber: '', cin: '', registeredAddress: '', city: '', state: '', pincode: '', contactEmail: '', phone: '', bankName: '', accountNumber: '', ifscCode: '', invoicePrefix: 'INV', currency: 'INR', timezone: 'Asia/Kolkata',
    });

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleFinish = async () => {
        setLoading(true);
        try {
            await profileAPI.update({ ...form, setupCompleted: true });
            await refreshUser();
            toast.success('Setup complete! Welcome to CoWorkSpace.');
            navigate('/');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">C</div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Setup Your Coworking Space</h1>
                    <p className="text-surface-500 mt-1">Complete the setup to get started</p>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${i <= step ? 'bg-primary-500 text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}`}>{i + 1}</div>
                            <span className={`text-sm hidden sm:inline ${i <= step ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-400'}`}>{s}</span>
                            {i < STEPS.length - 1 && <div className={`w-8 sm:w-12 h-0.5 ${i < step ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'}`} />}
                        </div>
                    ))}
                </div>

                <div className="glass-card p-6 sm:p-8">
                    {step === 0 && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-semibold mb-4">Coworking Space Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Space Name *</label>
                                    <input value={form.spaceName} onChange={e => update('spaceName', e.target.value)} placeholder="Awesome Coworking Hub" className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Contact Email</label>
                                    <input type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder="info@space.com" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Phone</label>
                                    <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" className="input-field" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Registered Address</label>
                                    <textarea value={form.registeredAddress} onChange={e => update('registeredAddress', e.target.value)} placeholder="123, Business Tower, Main Road" className="input-field h-20 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">City</label>
                                    <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Mumbai" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">State</label>
                                    <input value={form.state} onChange={e => update('state', e.target.value)} placeholder="Maharashtra" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Pincode</label>
                                    <input value={form.pincode} onChange={e => update('pincode', e.target.value)} placeholder="400001" className="input-field" />
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-semibold mb-4">Bank & Tax Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">GST Number</label>
                                    <input value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)} placeholder="22AAAAA0000A1Z5" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">PAN Number</label>
                                    <input value={form.panNumber} onChange={e => update('panNumber', e.target.value)} placeholder="AAAAA1234A" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">CIN (Optional)</label>
                                    <input value={form.cin} onChange={e => update('cin', e.target.value)} className="input-field" />
                                </div>
                                <div className="sm:col-span-2 border-t border-surface-200 dark:border-surface-700 pt-4 mt-2">
                                    <h3 className="font-medium mb-3">Bank Details (for invoices)</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Bank Name</label>
                                    <input value={form.bankName} onChange={e => update('bankName', e.target.value)} placeholder="HDFC Bank" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account Number</label>
                                    <input value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} placeholder="1234567890" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">IFSC Code</label>
                                    <input value={form.ifscCode} onChange={e => update('ifscCode', e.target.value)} placeholder="HDFC0001234" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Invoice Prefix</label>
                                    <input value={form.invoicePrefix} onChange={e => update('invoicePrefix', e.target.value)} className="input-field" />
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-lg font-semibold mb-4">Review & Confirm</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">Space Name</span><span className="font-medium">{form.spaceName || '—'}</span></div>
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">Email</span><span className="font-medium">{form.contactEmail || '—'}</span></div>
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">Phone</span><span className="font-medium">{form.phone || '—'}</span></div>
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">City</span><span className="font-medium">{form.city || '—'}, {form.state || '—'}</span></div>
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">GST</span><span className="font-medium">{form.gstNumber || '—'}</span></div>
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">PAN</span><span className="font-medium">{form.panNumber || '—'}</span></div>
                                <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-surface-500">Bank</span><span className="font-medium">{form.bankName || '—'}</span></div>
                                <div className="flex justify-between py-2"><span className="text-surface-500">Invoice Prefix</span><span className="font-medium">{form.invoicePrefix}</span></div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
                        <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary disabled:opacity-40">← Back</button>
                        {step < 2 ? (
                            <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.spaceName} className="btn-primary disabled:opacity-40">Next →</button>
                        ) : (
                            <button onClick={handleFinish} disabled={loading} className="btn-primary">
                                {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Complete Setup ✓'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
