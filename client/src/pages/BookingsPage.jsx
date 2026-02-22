import { useState, useEffect } from 'react';
import { roomsAPI, companiesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const VIEWS = ['day', 'week', 'month'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('week');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ roomId: '', companyId: '', bookingDate: '', startTime: '09:00', endTime: '10:00', attendees: 1, purpose: '', specialRequirements: '' });
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const d = new Date(selectedDate);
            let startDate = selectedDate, endDate = selectedDate;
            if (view === 'week') {
                const day = d.getDay();
                const start = new Date(d); start.setDate(d.getDate() - day + 1);
                const end = new Date(start); end.setDate(start.getDate() + 6);
                startDate = start.toISOString().split('T')[0]; endDate = end.toISOString().split('T')[0];
            } else if (view === 'month') {
                startDate = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
            }
            const [b, r, c] = await Promise.all([roomsAPI.bookings(`startDate=${startDate}&endDate=${endDate}`), roomsAPI.list(), companiesAPI.list()]);
            setBookings(b); setRooms(r); setCompanies(c);
        } catch { setBookings([]); setRooms([]); setCompanies([]); }
        setLoading(false);
    };
    useEffect(() => { load(); }, [selectedDate, view]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try { await roomsAPI.createBooking(form); toast.success('Booking created'); setShowCreate(false); load(); } catch (err) { toast.error(err.message); }
    };

    const handleStatusUpdate = async (id, status, rejectionReason) => {
        try { await roomsAPI.updateBookingStatus(id, { status, rejectionReason }); toast.success(`Booking ${status}`); load(); } catch (err) { toast.error(err.message); }
    };

    const statusColors = { pending: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 text-amber-800 dark:text-amber-300', approved: 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-800 dark:text-green-300', rejected: 'bg-red-100 dark:bg-red-900/30 border-red-300 text-red-800 dark:text-red-300', cancelled: 'bg-surface-100 dark:bg-surface-800 border-surface-300 text-surface-600 dark:text-surface-400', completed: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 text-blue-800 dark:text-blue-300' };

    const getWeekDays = () => {
        const d = new Date(selectedDate);
        const day = d.getDay() || 7;
        const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
        return Array.from({ length: 7 }, (_, i) => { const dd = new Date(mon); dd.setDate(mon.getDate() + i); return dd; });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Room Bookings</h1><p className="text-sm text-surface-500">{bookings.length} bookings</p></div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-0.5">{VIEWS.map(v => <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${view === v ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>{v}</button>)}</div>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-field w-40" />
                    <button onClick={() => setShowCreate(true)} className="btn-primary whitespace-nowrap">+ Book Room</button>
                </div>
            </div>

            {/* Calendar View */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-6"><div className="skeleton h-64 rounded-xl" /></div>
                ) : view === 'week' ? (
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                            <div className="grid grid-cols-8 border-b border-surface-200 dark:border-surface-800">
                                <div className="p-3 text-xs font-medium text-surface-400">Time</div>
                                {getWeekDays().map(d => (
                                    <div key={d.toISOString()} className={`p-3 text-center border-l border-surface-200 dark:border-surface-800 ${d.toDateString() === new Date().toDateString() ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                                        <p className="text-xs text-surface-400">{d.toLocaleDateString('en', { weekday: 'short' })}</p>
                                        <p className={`text-sm font-semibold ${d.toDateString() === new Date().toDateString() ? 'text-primary-600' : 'text-surface-700 dark:text-surface-300'}`}>{d.getDate()}</p>
                                    </div>
                                ))}
                            </div>
                            {HOURS.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b border-surface-100 dark:border-surface-800/50 min-h-[48px]">
                                    <div className="p-2 text-xs text-surface-400 text-right pr-3">{hour}:00</div>
                                    {getWeekDays().map(d => {
                                        const dateStr = d.toISOString().split('T')[0];
                                        const dayBookings = bookings.filter(b => b.bookingDate === dateStr && parseInt(b.startTime) <= hour && parseInt(b.endTime) > hour);
                                        return (
                                            <div key={dateStr} className="border-l border-surface-100 dark:border-surface-800/50 p-0.5 relative">
                                                {dayBookings.map(b => parseInt(b.startTime) === hour && (
                                                    <div key={b.id} className={`text-[10px] p-1.5 rounded-lg border m-0.5 cursor-pointer ${statusColors[b.status]}`} title={`${b.room?.name} - ${b.company?.name}`}>
                                                        <p className="font-medium truncate">{b.room?.name}</p>
                                                        <p className="truncate opacity-75">{b.startTime?.slice(0, 5)}-{b.endTime?.slice(0, 5)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* List view fallback for day/month */
                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                        {bookings.length === 0 ? (
                            <div className="p-12 text-center"><span className="text-4xl block mb-3">📅</span><p className="text-surface-500">No bookings for this period</p></div>
                        ) : bookings.map(b => (
                            <div key={b.id} className="p-4 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${statusColors[b.status]}`}>
                                        {b.bookingDate?.split('-')[2]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-surface-900 dark:text-surface-100">{b.room?.name} <span className="text-surface-400 font-normal">· {b.company?.name}</span></p>
                                        <p className="text-xs text-surface-500">{b.bookingDate} · {b.startTime?.slice(0, 5)} - {b.endTime?.slice(0, 5)} · {b.attendees} attendees</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${statusColors[b.status]} border`}>{b.status}</span>
                                    {b.status === 'pending' && (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleStatusUpdate(b.id, 'approved')} className="btn-ghost text-xs text-green-600">✓</button>
                                            <button onClick={() => handleStatusUpdate(b.id, 'rejected', 'Rejected by admin')} className="btn-ghost text-xs text-red-500">✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create booking modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="glass-card w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">Book Meeting Room</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Meeting Room *</label>
                                <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} className="select-field" required>
                                    <option value="">Select room</option>
                                    {rooms.filter(r => r.status === 'active').map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Company *</label>
                                <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className="select-field" required>
                                    <option value="">Select company</option>
                                    {companies.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={form.bookingDate} onChange={e => setForm(f => ({ ...f, bookingDate: e.target.value }))} className="input-field" required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Start Time</label><input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="input-field" required /></div>
                                <div><label className="block text-sm font-medium mb-1">End Time</label><input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="input-field" required /></div>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Attendees</label><input type="number" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: parseInt(e.target.value) }))} className="input-field" min="1" /></div>
                            <div><label className="block text-sm font-medium mb-1">Purpose</label><input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} className="input-field" placeholder="Team meeting" /></div>
                            <div><label className="block text-sm font-medium mb-1">Special Requirements</label><textarea value={form.specialRequirements} onChange={e => setForm(f => ({ ...f, specialRequirements: e.target.value }))} className="input-field h-16 resize-none" /></div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create Booking</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
