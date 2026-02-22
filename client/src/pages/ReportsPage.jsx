import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';

const REPORT_TYPES = [
    { id: 'revenue', label: 'Revenue Report', icon: '💰', desc: 'Monthly revenue breakdown with GST' },
    { id: 'gst', label: 'GST Report', icon: '🧾', desc: 'GST collected on all invoices' },
    { id: 'overdue', label: 'Overdue Report', icon: '🚨', desc: 'Unpaid and overdue invoices' },
    { id: 'rooms', label: 'Room Utilization', icon: '🚪', desc: 'Meeting room usage analytics' },
];

export default function ReportsPage() {
    const [active, setActive] = useState('revenue');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        setLoading(true);
        const params = `startDate=${startDate}&endDate=${endDate}`;
        const fetcher = { revenue: () => reportsAPI.revenue(params), gst: () => reportsAPI.gst(params), overdue: () => reportsAPI.overdue(), rooms: () => reportsAPI.roomUtilization(params) }[active];
        fetcher().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
    }, [active, startDate, endDate]);

    const exportCSV = () => {
        let csv = '';
        if (active === 'revenue' && data?.invoices) {
            csv = 'Invoice,Company,Amount,GST,Total,Paid Date\n' + data.invoices.map(i => `${i.invoiceNumber},${i.company?.name},${i.subtotal},${i.gstAmount},${i.total},${i.paidDate}`).join('\n');
        } else if (active === 'gst' && data?.invoices) {
            csv = 'Invoice,Company,GST Number,Subtotal,GST Amount,Total\n' + data.invoices.map(i => `${i.invoiceNumber},${i.company?.name},${i.company?.gstNumber},${i.subtotal},${i.gstAmount},${i.total}`).join('\n');
        } else if (active === 'overdue' && Array.isArray(data)) {
            csv = 'Invoice,Company,Total,Due Date,Status\n' + data.map(i => `${i.invoiceNumber},${i.company?.name},${i.total},${i.dueDate},${i.status}`).join('\n');
        }
        if (csv) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${active}_report.csv`; a.click();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Reports</h1><p className="text-sm text-surface-500">Generate and export reports</p></div>
                <button onClick={exportCSV} className="btn-secondary">📥 Export CSV</button>
            </div>

            {/* Report type selector */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {REPORT_TYPES.map(rt => (
                    <button key={rt.id} onClick={() => setActive(rt.id)} className={`stat-card text-left transition-all ${active === rt.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-950' : ''}`}>
                        <span className="text-2xl mb-2 block">{rt.icon}</span>
                        <p className="font-semibold text-sm text-surface-900 dark:text-surface-100">{rt.label}</p>
                        <p className="text-xs text-surface-500 mt-1">{rt.desc}</p>
                    </button>
                ))}
            </div>

            {/* Date range filter */}
            {active !== 'overdue' && (
                <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm font-medium text-surface-500">Date Range:</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field w-40" />
                    <span className="text-surface-400">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field w-40" />
                </div>
            )}

            {/* Report content */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
                ) : !data || (Array.isArray(data) && data.length === 0) || (data.invoices && data.invoices.length === 0) ? (
                    <div className="p-12 text-center"><span className="text-4xl block mb-3">📊</span><p className="text-surface-500">No data for this period</p></div>
                ) : (
                    <>
                        {/* Summary cards */}
                        {active === 'revenue' && data.total !== undefined && (
                            <div className="grid grid-cols-2 gap-4 p-6 border-b border-surface-100 dark:border-surface-800">
                                <div className="text-center"><p className="text-sm text-surface-500">Total Revenue</p><p className="text-2xl font-bold text-green-500">₹{Number(data.total).toLocaleString()}</p></div>
                                <div className="text-center"><p className="text-sm text-surface-500">Total GST</p><p className="text-2xl font-bold text-primary-500">₹{Number(data.totalGst).toLocaleString()}</p></div>
                            </div>
                        )}
                        {active === 'gst' && data.totalGst !== undefined && (
                            <div className="p-6 border-b border-surface-100 dark:border-surface-800 text-center">
                                <p className="text-sm text-surface-500">Total GST Collected</p><p className="text-2xl font-bold text-primary-500">₹{Number(data.totalGst).toLocaleString()}</p>
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-50 dark:bg-surface-800/50">
                                    <tr>
                                        <th className="table-header">Invoice #</th>
                                        <th className="table-header">Company</th>
                                        <th className="table-header">Amount</th>
                                        <th className="table-header">GST</th>
                                        <th className="table-header">Total</th>
                                        <th className="table-header">{active === 'overdue' ? 'Due Date' : 'Date'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                                    {(data.invoices || data || []).map(inv => (
                                        <tr key={inv.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                            <td className="table-cell font-mono text-primary-600 dark:text-primary-400">{inv.invoiceNumber}</td>
                                            <td className="table-cell">{inv.company?.name || '—'}</td>
                                            <td className="table-cell">₹{Number(inv.subtotal).toLocaleString()}</td>
                                            <td className="table-cell">₹{Number(inv.gstAmount).toLocaleString()}</td>
                                            <td className="table-cell font-semibold">₹{Number(inv.total).toLocaleString()}</td>
                                            <td className="table-cell">{inv.paidDate || inv.dueDate || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
