import { useState, useEffect } from 'react';
import { settingsAPI, profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TABS = ['Profile', 'Reminders', 'Email Templates', 'Audit Log'];

export default function SettingsPage() {
    const [tab, setTab] = useState('Profile');
    const { user, refreshUser } = useAuth();
    const toast = useToast();

    // Profile
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Reminders
    const [reminders, setReminders] = useState({ beforeDays: 3, onDueDate: true, afterDays: 7, enabled: true });

    // Templates
    const [templates, setTemplates] = useState([]);
    const [editingTpl, setEditingTpl] = useState(null);

    // Audit
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotal, setAuditTotal] = useState(0);

    useEffect(() => {
        if (tab === 'Profile') {
            profileAPI.get().then(setProfile).catch(() => { });
        } else if (tab === 'Reminders') {
            settingsAPI.getReminders().then(setReminders).catch(() => { });
        } else if (tab === 'Email Templates') {
            settingsAPI.getEmailTemplates().then(setTemplates).catch(() => { });
        } else if (tab === 'Audit Log') {
            settingsAPI.getAuditLogs(`page=${auditPage}`).then(d => { setAuditLogs(d.logs); setAuditTotal(d.total); }).catch(() => { });
        }
    }, [tab, auditPage]);

    const saveProfile = async () => {
        setProfileLoading(true);
        try { await profileAPI.update(profile); await refreshUser(); toast.success('Profile saved'); } catch (err) { toast.error(err.message); }
        setProfileLoading(false);
    };

    const saveReminders = async () => {
        try { await settingsAPI.updateReminders(reminders); toast.success('Reminders saved'); } catch (err) { toast.error(err.message); }
    };

    const saveTemplate = async (tpl) => {
        try { await settingsAPI.updateEmailTemplate(tpl.id, tpl); toast.success('Template saved'); setEditingTpl(null); settingsAPI.getEmailTemplates().then(setTemplates); } catch (err) { toast.error(err.message); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div><h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Settings</h1><p className="text-sm text-surface-500">Manage your workspace configuration</p></div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 overflow-x-auto">
                {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700'}`}>{t}</button>)}
            </div>

            <div className="glass-card p-6">
                {/* Profile Tab */}
                {tab === 'Profile' && profile && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-lg font-semibold mb-4">Owner Profile</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Space Name</label><input value={profile.spaceName || ''} onChange={e => setProfile(p => ({ ...p, spaceName: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Contact Email</label><input value={profile.contactEmail || ''} onChange={e => setProfile(p => ({ ...p, contactEmail: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Phone</label><input value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">GST Number</label><input value={profile.gstNumber || ''} onChange={e => setProfile(p => ({ ...p, gstNumber: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">PAN Number</label><input value={profile.panNumber || ''} onChange={e => setProfile(p => ({ ...p, panNumber: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Invoice Prefix</label><input value={profile.invoicePrefix || ''} onChange={e => setProfile(p => ({ ...p, invoicePrefix: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Currency</label>
                                <select value={profile.currency || 'INR'} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))} className="select-field">
                                    <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Timezone</label><input value={profile.timezone || ''} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Bank Name</label><input value={profile.bankName || ''} onChange={e => setProfile(p => ({ ...p, bankName: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Account Number</label><input value={profile.accountNumber || ''} onChange={e => setProfile(p => ({ ...p, accountNumber: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">IFSC Code</label><input value={profile.ifscCode || ''} onChange={e => setProfile(p => ({ ...p, ifscCode: e.target.value }))} className="input-field" /></div>
                            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><textarea value={profile.registeredAddress || ''} onChange={e => setProfile(p => ({ ...p, registeredAddress: e.target.value }))} className="input-field h-16 resize-none" /></div>
                        </div>
                        <div className="flex justify-end pt-4"><button onClick={saveProfile} disabled={profileLoading} className="btn-primary">{profileLoading ? 'Saving...' : 'Save Profile'}</button></div>
                    </div>
                )}

                {/* Reminders Tab */}
                {tab === 'Reminders' && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-lg font-semibold">Reminder Settings</h2>
                        <div className="flex items-center gap-3"><input type="checkbox" checked={reminders.enabled} onChange={e => setReminders(r => ({ ...r, enabled: e.target.checked }))} className="w-4 h-4 rounded border-surface-300 text-primary-500" /><label className="font-medium">Enable Reminders</label></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium mb-1">Days Before Due Date</label><input type="number" value={reminders.beforeDays} onChange={e => setReminders(r => ({ ...r, beforeDays: parseInt(e.target.value) }))} className="input-field" min="0" /></div>
                            <div className="flex items-center gap-3"><input type="checkbox" checked={reminders.onDueDate} onChange={e => setReminders(r => ({ ...r, onDueDate: e.target.checked }))} className="w-4 h-4 rounded border-surface-300 text-primary-500" /><label className="text-sm font-medium">Remind On Due Date</label></div>
                            <div><label className="block text-sm font-medium mb-1">Days After (if unpaid)</label><input type="number" value={reminders.afterDays} onChange={e => setReminders(r => ({ ...r, afterDays: parseInt(e.target.value) }))} className="input-field" min="0" /></div>
                        </div>
                        <div className="flex justify-end"><button onClick={saveReminders} className="btn-primary">Save Reminders</button></div>
                    </div>
                )}

                {/* Email Templates Tab */}
                {tab === 'Email Templates' && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-lg font-semibold">Email Templates</h2>
                        <p className="text-sm text-surface-500">Use {'{{variables}}'} like {'{{companyName}}'}, {'{{invoiceNumber}}'}, {'{{total}}'}, {'{{dueDate}}'}</p>
                        <div className="space-y-3">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                                    {editingTpl === tpl.id ? (
                                        <div className="space-y-3">
                                            <input value={tpl.subject} onChange={e => setTemplates(ts => ts.map(t => t.id === tpl.id ? { ...t, subject: e.target.value } : t))} className="input-field" placeholder="Subject" />
                                            <textarea value={tpl.body} onChange={e => setTemplates(ts => ts.map(t => t.id === tpl.id ? { ...t, body: e.target.value } : t))} className="input-field h-32 resize-none font-mono text-sm" />
                                            <div className="flex gap-2"><button onClick={() => saveTemplate(tpl)} className="btn-primary text-sm">Save</button><button onClick={() => setEditingTpl(null)} className="btn-secondary text-sm">Cancel</button></div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-surface-900 dark:text-surface-100 capitalize">{tpl.templateType?.replace(/_/g, ' ')}</p>
                                                <p className="text-sm text-surface-500 mt-0.5">{tpl.subject}</p>
                                            </div>
                                            <button onClick={() => setEditingTpl(tpl.id)} className="btn-ghost text-xs">Edit</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Audit Log Tab */}
                {tab === 'Audit Log' && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-lg font-semibold">Activity Log</h2>
                        <div className="space-y-2">
                            {auditLogs.length === 0 ? (
                                <p className="text-surface-500 text-center py-8">No activity recorded yet</p>
                            ) : auditLogs.map(log => (
                                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-xs">
                                        {log.action === 'create' ? '➕' : log.action === 'update' ? '✏️' : log.action === 'delete' ? '🗑️' : '📋'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 capitalize">{log.action} {log.entityType}</p>
                                        <p className="text-xs text-surface-400">{new Date(log.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {auditTotal > 50 && (
                            <div className="flex justify-center gap-2 pt-4">
                                <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1} className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
                                <span className="text-sm text-surface-500 self-center">Page {auditPage}</span>
                                <button onClick={() => setAuditPage(p => p + 1)} className="btn-secondary text-sm">Next →</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
