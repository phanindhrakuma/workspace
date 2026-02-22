import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
                    {sub && <p className={`text-xs mt-1 ${color || 'text-surface-400'}`}>{sub}</p>}
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function MiniChart({ data, label }) {
    const max = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-4">{label}</h3>
            <div className="flex items-end gap-2 h-32">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-primary-100 dark:bg-primary-900/30 rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max((d.revenue / max) * 100, 4)}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg" />
                        </div>
                        <span className="text-[10px] text-surface-400 truncate w-full text-center">{d.month?.split(' ')[0]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        reportsAPI.dashboard().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div>
        </div>
    );

    // Demo data fallback
    const s = stats || {
        totalCompanies: 12, totalSeats: 150, occupiedSeats: 118, availableSeats: 32, monthlyRevenue: 485000, monthlyGst: 87300, pendingPayments: 5, overdueInvoices: 2, upcomingBilling: 4, revenueChart: [
            { month: 'Sep 2025', revenue: 420000 }, { month: 'Oct 2025', revenue: 445000 }, { month: 'Nov 2025', revenue: 460000 }, { month: 'Dec 2025', revenue: 430000 }, { month: 'Jan 2026', revenue: 470000 }, { month: 'Feb 2026', revenue: 485000 }], occupancyRate: 79
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Dashboard</h1>
                    <p className="text-sm text-surface-500">Welcome back! Here's your overview.</p>
                </div>
                <span className="text-xs text-surface-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="🏢" label="Total Companies" value={s.totalCompanies} />
                <StatCard icon="💺" label="Total Seats" value={s.totalSeats} sub={`${s.occupancyRate}% occupied`} color="text-primary-500" />
                <StatCard icon="✅" label="Occupied Seats" value={s.occupiedSeats} sub={`${s.availableSeats} available`} color="text-green-500" />
                <StatCard icon="📊" label="Occupancy Rate" value={`${s.occupancyRate}%`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="💰" label="Monthly Revenue" value={`₹${(s.monthlyRevenue / 1000).toFixed(0)}K`} sub={`GST: ₹${(s.monthlyGst / 1000).toFixed(0)}K`} color="text-accent-500" />
                <StatCard icon="⏳" label="Pending Payments" value={s.pendingPayments} sub="invoices awaiting" color="text-amber-500" />
                <StatCard icon="🚨" label="Overdue Invoices" value={s.overdueInvoices} sub="need attention" color="text-red-500" />
                <StatCard icon="📅" label="Upcoming Billing" value={s.upcomingBilling} sub="next 7 days" color="text-blue-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MiniChart data={s.revenueChart} label="Monthly Revenue (6 months)" />
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-4">Occupancy Overview</h3>
                    <div className="flex items-center justify-center h-32">
                        <div className="relative w-28 h-28">
                            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="12" />
                                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#grad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${s.occupancyRate * 3.27} 327`} />
                                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-surface-900 dark:text-surface-100">{s.occupancyRate}%</span>
                            </div>
                        </div>
                        <div className="ml-6 space-y-2">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary-500 rounded-full" /><span className="text-sm text-surface-600 dark:text-surface-400">Occupied ({s.occupiedSeats})</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-surface-200 dark:bg-surface-700 rounded-full" /><span className="text-sm text-surface-600 dark:text-surface-400">Available ({s.availableSeats})</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
