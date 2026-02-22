import { useState, useEffect } from 'react';
import { companiesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const initForm = { name: '', gstNumber: '', contactPerson: '', email: '', phone: '', address: '', agreementStart: '', agreementEnd: '', seats: 1, seatCost: 5000, billingCycle: 'monthly', gstApplicable: true, gstPercent: 18, advanceAmount: 0, securityDeposit: 0, billingDate: 1, prorata: false, notes: '' };

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initForm);
    const [search, setSearch] = useState('');
    const toast = useToast();

    const load = () => { setLoading(true); companiesAPI.list(`search=${search}`).then(setCompanies).catch(() => setCompanies([])).finally(() => setLoading(false)); };
    useEffect(load, [search]);

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const openAdd = () => { setEditing(null); setForm(initForm); setShowModal(true); };
    const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, gstNumber: c.gstNumber || '', contactPerson: c.contactPerson || '', email: c.email || '', phone: c.phone || '', address: c.address || '', agreementStart: c.agreementStart || '', agreementEnd: c.agreementEnd || '', seats: c.seats, seatCost: c.seatCost, billingCycle: c.billingCycle, gstApplicable: c.gstApplicable, gstPercent: c.gstPercent, advanceAmount: c.advanceAmount, securityDeposit: c.securityDeposit, billingDate: c.billingDate, prorata: c.prorata, notes: c.notes || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await companiesAPI.update(editing, form); toast.success('Company updated'); }
            else { await companiesAPI.create(form); toast.success('Company added'); }
            setShowModal(false); load();
        } catch (err) { toast.error(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Terminate this company?')) return;
        try { await companiesAPI.delete(id); toast.success('Company terminated'); load(); } catch (err) { toast.error(err.message); }
    };

    const statusBadge = (s) => s === 'active' ? 'badge-success' : s === 'inactive' ? 'badge-warning' : 'badge-danger';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Companies</h1>
                    <p className="text-sm text-surface-500">{companies.length} companies registered</p>
                </div>
                <div className="flex items-center gap-3">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." className="input-field w-52" />
                    <button onClick={openAdd} className="btn-primary whitespace-nowrap">+ Add Company</button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
                ) : companies.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="text-4xl mb-4 block">🏢</span>
                        <p className="text-lg font-medium text-surface-600 dark:text-surface-400">No companies yet</p>
                        <p className="text-sm text-surface-400 mt-1">Add your first company to get started</p>
                        <button onClick={openAdd} className="btn-primary mt-4">+ Add Company</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-50 dark:bg-surface-800/50">
                                <tr>
                                    <th className="table-header">Company</th>
                                    <th className="table-header">Contact</th>
                                    <th className="table-header">Seats</th>
                                    <th className="table-header">Cost/Seat</th>
                                    <th className="table-header">GST</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                                {companies.map(c => (
                                    <tr key={c.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                        <td className="table-cell"><div><p className="font-medium text-surface-900 dark:text-surface-100">{c.name}</p><p className="text-xs text-surface-400">{c.gstNumber || 'No GST'}</p></div></td>
                                        <td className="table-cell"><div><p className="text-sm">{c.contactPerson || '—'}</p><p className="text-xs text-surface-400">{c.email}</p></div></td>
                                        <td className="table-cell font-medium">{c.seats}</td>
                                        <td className="table-cell">₹{Number(c.seatCost).toLocaleString()}</td>
                                        <td className="table-cell">{c.gstApplicable ? `${c.gstPercent}%` : 'No'}</td>
                                        <td className="table-cell"><span className={statusBadge(c.status)}>{c.status}</span></td>
                                        <td className="table-cell">
                                            <div className="flex gap-1">
                                                <button onClick={() => openEdit(c)} className="btn-ghost text-xs">Edit</button>
                                                <button onClick={() => handleDelete(c.id)} className="btn-ghost text-xs text-red-500 hover:text-red-600">×</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Company' : 'Add Company'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Company Name *</label><input value={form.name} onChange={e => update('name', e.target.value)} className="input-field" required /></div>
                                <div><label className="block text-sm font-medium mb-1">GST Number</label><input value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Contact Person</label><input value={form.contactPerson} onChange={e => update('contactPerson', e.target.value)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field" /></div>
                                <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><textarea value={form.address} onChange={e => update('address', e.target.value)} className="input-field h-16 resize-none" /></div>
                                <div><label className="block text-sm font-medium mb-1">Agreement Start</label><input type="date" value={form.agreementStart} onChange={e => update('agreementStart', e.target.value)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Agreement End</label><input type="date" value={form.agreementEnd} onChange={e => update('agreementEnd', e.target.value)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Number of Seats</label><input type="number" value={form.seats} onChange={e => update('seats', parseInt(e.target.value) || 1)} className="input-field" min="1" /></div>
                                <div><label className="block text-sm font-medium mb-1">Seat Cost (₹)</label><input type="number" value={form.seatCost} onChange={e => update('seatCost', parseFloat(e.target.value) || 0)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Billing Cycle</label><select value={form.billingCycle} onChange={e => update('billingCycle', e.target.value)} className="select-field"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="custom">Custom</option></select></div>
                                <div><label className="block text-sm font-medium mb-1">Billing Date (day)</label><input type="number" value={form.billingDate} onChange={e => update('billingDate', parseInt(e.target.value) || 1)} className="input-field" min="1" max="28" /></div>
                                <div className="flex items-center gap-3"><input type="checkbox" checked={form.gstApplicable} onChange={e => update('gstApplicable', e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" /><label className="text-sm font-medium">GST Applicable</label></div>
                                {form.gstApplicable && <div><label className="block text-sm font-medium mb-1">GST %</label><input type="number" value={form.gstPercent} onChange={e => update('gstPercent', parseFloat(e.target.value))} className="input-field" /></div>}
                                <div><label className="block text-sm font-medium mb-1">Advance Amount (₹)</label><input type="number" value={form.advanceAmount} onChange={e => update('advanceAmount', parseFloat(e.target.value) || 0)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Security Deposit (₹)</label><input type="number" value={form.securityDeposit} onChange={e => update('securityDeposit', parseFloat(e.target.value) || 0)} className="input-field" /></div>
                                <div className="flex items-center gap-3"><input type="checkbox" checked={form.prorata} onChange={e => update('prorata', e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" /><label className="text-sm font-medium">Pro-rata First Month</label></div>
                                <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Notes</label><textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input-field h-16 resize-none" /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add Company'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
