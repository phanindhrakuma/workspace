import { useState, useEffect } from 'react';
import { invoicesAPI, companiesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerate, setShowGenerate] = useState(false);
    const [showPayment, setShowPayment] = useState(null);
    const [filter, setFilter] = useState('');
    const toast = useToast();

    const [genForm, setGenForm] = useState({ companyId: '', type: 'recurring', dueDate: '', notes: '', billingPeriodStart: '', billingPeriodEnd: '', lineItems: [] });
    const [payForm, setPayForm] = useState({ amount: 0, paymentDate: new Date().toISOString().split('T')[0], mode: 'bank_transfer', transactionId: '' });

    const load = () => {
        setLoading(true);
        Promise.all([invoicesAPI.list(`status=${filter}`), companiesAPI.list()]).then(([inv, comp]) => { setInvoices(inv); setCompanies(comp); }).catch(() => { }).finally(() => setLoading(false));
    };
    useEffect(load, [filter]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        try { await invoicesAPI.generate(genForm); toast.success('Invoice generated'); setShowGenerate(false); load(); } catch (err) { toast.error(err.message); }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try { await invoicesAPI.recordPayment(showPayment, payForm); toast.success('Payment recorded'); setShowPayment(null); load(); } catch (err) { toast.error(err.message); }
    };

    const handleCancel = async (id) => {
        if (!confirm('Cancel this invoice?')) return;
        try { await invoicesAPI.delete(id); toast.success('Invoice cancelled'); load(); } catch (err) { toast.error(err.message); }
    };

    const statusBadge = (s) => ({ paid: 'badge-success', partial: 'badge-warning', overdue: 'badge-danger', sent: 'badge-info', draft: 'badge-neutral', cancelled: 'badge-neutral' }[s] || 'badge-neutral');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Invoices</h1>
                    <p className="text-sm text-surface-500">{invoices.length} invoices</p>
                </div>
                <div className="flex gap-3">
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="select-field w-40">
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <button onClick={() => setShowGenerate(true)} className="btn-primary whitespace-nowrap">+ Generate Invoice</button>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center"><span className="text-4xl block mb-3">🧾</span><p className="text-lg font-medium text-surface-600 dark:text-surface-400">No invoices yet</p><button onClick={() => setShowGenerate(true)} className="btn-primary mt-4">Generate First Invoice</button></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-50 dark:bg-surface-800/50">
                                <tr>
                                    <th className="table-header">Invoice #</th>
                                    <th className="table-header">Company</th>
                                    <th className="table-header">Type</th>
                                    <th className="table-header">Subtotal</th>
                                    <th className="table-header">GST</th>
                                    <th className="table-header">Total</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Due Date</th>
                                    <th className="table-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                        <td className="table-cell font-mono font-medium text-primary-600 dark:text-primary-400">{inv.invoiceNumber}</td>
                                        <td className="table-cell">{inv.company?.name || '—'}</td>
                                        <td className="table-cell capitalize">{inv.type}</td>
                                        <td className="table-cell">₹{Number(inv.subtotal).toLocaleString()}</td>
                                        <td className="table-cell text-surface-400">₹{Number(inv.gstAmount).toLocaleString()}</td>
                                        <td className="table-cell font-semibold">₹{Number(inv.total).toLocaleString()}</td>
                                        <td className="table-cell"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                                        <td className="table-cell text-sm">{inv.dueDate || '—'}</td>
                                        <td className="table-cell">
                                            <div className="flex gap-1">
                                                {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                                                    <button onClick={() => { setShowPayment(inv.id); setPayForm({ amount: Number(inv.total) - Number(inv.paidAmount || 0), paymentDate: new Date().toISOString().split('T')[0], mode: 'bank_transfer', transactionId: '' }); }} className="btn-ghost text-xs text-green-600">Pay</button>
                                                )}
                                                {inv.status === 'draft' && <button onClick={() => handleCancel(inv.id)} className="btn-ghost text-xs text-red-500">Cancel</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Generate modal */}
            {showGenerate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGenerate(false)}>
                    <div className="glass-card w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">Generate Invoice</h2>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Company *</label>
                                <select value={genForm.companyId} onChange={e => setGenForm(f => ({ ...f, companyId: e.target.value }))} className="select-field" required>
                                    <option value="">Select company</option>
                                    {companies.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Invoice Type</label>
                                <select value={genForm.type} onChange={e => setGenForm(f => ({ ...f, type: e.target.value }))} className="select-field">
                                    <option value="recurring">Recurring Monthly</option>
                                    <option value="prorata">Pro-rata</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            {genForm.type === 'prorata' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium mb-1">Period Start</label><input type="date" value={genForm.billingPeriodStart} onChange={e => setGenForm(f => ({ ...f, billingPeriodStart: e.target.value }))} className="input-field" /></div>
                                    <div><label className="block text-sm font-medium mb-1">Period End</label><input type="date" value={genForm.billingPeriodEnd} onChange={e => setGenForm(f => ({ ...f, billingPeriodEnd: e.target.value }))} className="input-field" /></div>
                                </div>
                            )}
                            <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" value={genForm.dueDate} onChange={e => setGenForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={genForm.notes} onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-16 resize-none" /></div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowGenerate(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Generate</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(null)}>
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">Record Payment</h2>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Amount (₹)</label><input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} className="input-field" required /></div>
                            <div><label className="block text-sm font-medium mb-1">Payment Date</label><input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} className="input-field" required /></div>
                            <div><label className="block text-sm font-medium mb-1">Payment Mode</label>
                                <select value={payForm.mode} onChange={e => setPayForm(f => ({ ...f, mode: e.target.value }))} className="select-field">
                                    <option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="card">Card</option>
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Transaction ID</label><input value={payForm.transactionId} onChange={e => setPayForm(f => ({ ...f, transactionId: e.target.value }))} className="input-field" /></div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowPayment(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Record Payment</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
