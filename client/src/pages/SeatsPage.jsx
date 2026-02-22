import { useState, useEffect } from 'react';
import { seatsAPI, companiesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function SeatsPage() {
    const [seats, setSeats] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ count: 5, type: 'dedicated', floor: 'Ground', labelPrefix: 'S' });
    const [assignModal, setAssignModal] = useState(null);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [s, c] = await Promise.all([seatsAPI.list(), companiesAPI.list()]);
            setSeats(s); setCompanies(c);
        } catch { setSeats([]); setCompanies([]); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const stats = {
        total: seats.length,
        occupied: seats.filter(s => s.status === 'occupied').length,
        available: seats.filter(s => s.status === 'available').length,
    };

    const handleAdd = async () => {
        try { await seatsAPI.create(addForm); toast.success(`${addForm.count} seats added`); setShowAdd(false); load(); } catch (err) { toast.error(err.message); }
    };

    const handleAssign = async (seatId, companyId) => {
        try { await seatsAPI.assign(seatId, { companyId }); toast.success('Seat assigned'); setAssignModal(null); load(); } catch (err) { toast.error(err.message); }
    };

    const handleUnassign = async (seatId) => {
        try { await seatsAPI.unassign(seatId); toast.success('Seat unassigned'); load(); } catch (err) { toast.error(err.message); }
    };

    const handleDelete = async (id) => {
        try { await seatsAPI.delete(id); toast.success('Seat deleted'); load(); } catch (err) { toast.error(err.message); }
    };

    const typeColors = { hot_desk: 'bg-blue-400', dedicated: 'bg-primary-400', private_cabin: 'bg-amber-400' };
    const statusColors = { available: 'bg-green-400', occupied: 'bg-red-400', maintenance: 'bg-surface-400' };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Seat Management</h1>
                    <p className="text-sm text-surface-500">{stats.total} total seats · {stats.occupied} occupied · {stats.available} available</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-primary">+ Add Seats</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="stat-card text-center"><p className="text-3xl font-bold text-surface-900 dark:text-surface-100">{stats.total}</p><p className="text-sm text-surface-500">Total</p></div>
                <div className="stat-card text-center"><p className="text-3xl font-bold text-green-500">{stats.available}</p><p className="text-sm text-surface-500">Available</p></div>
                <div className="stat-card text-center"><p className="text-3xl font-bold text-red-500">{stats.occupied}</p><p className="text-sm text-surface-500">Occupied</p></div>
            </div>

            {/* Seat Grid */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Seat Map</h2>
                {loading ? (
                    <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-12 gap-3">{[...Array(24)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
                ) : seats.length === 0 ? (
                    <div className="text-center py-12"><span className="text-4xl block mb-3">💺</span><p className="text-surface-500">No seats configured yet</p><button onClick={() => setShowAdd(true)} className="btn-primary mt-3">Add Seats</button></div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-3">
                        {seats.map(seat => (
                            <div key={seat.id} className={`relative group p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${seat.status === 'occupied' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : seat.status === 'available' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800'}`} onClick={() => seat.status === 'available' ? setAssignModal(seat) : seat.status === 'occupied' && handleUnassign(seat.id)}>
                                <div className={`w-2 h-2 rounded-full absolute top-2 right-2 ${statusColors[seat.status]}`} />
                                <p className="text-xs font-bold text-surface-800 dark:text-surface-200">{seat.label}</p>
                                <p className="text-[10px] text-surface-400 truncate">{seat.company?.name || seat.type.replace('_', ' ')}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-4 mt-4 text-xs text-surface-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-400 rounded-full" />Available</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full" />Occupied</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-surface-400 rounded-full" />Maintenance</span>
                </div>
            </div>

            {/* Add seats modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">Add Seats</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Number of Seats</label><input type="number" value={addForm.count} onChange={e => setAddForm(f => ({ ...f, count: parseInt(e.target.value) || 1 }))} className="input-field" min="1" max="500" /></div>
                            <div><label className="block text-sm font-medium mb-1">Type</label><select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} className="select-field"><option value="dedicated">Dedicated Desk</option><option value="hot_desk">Hot Desk</option><option value="private_cabin">Private Cabin</option></select></div>
                            <div><label className="block text-sm font-medium mb-1">Floor</label><input value={addForm.floor} onChange={e => setAddForm(f => ({ ...f, floor: e.target.value }))} className="input-field" /></div>
                            <div><label className="block text-sm font-medium mb-1">Label Prefix</label><input value={addForm.labelPrefix} onChange={e => setAddForm(f => ({ ...f, labelPrefix: e.target.value }))} className="input-field" /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button><button onClick={handleAdd} className="btn-primary">Add {addForm.count} Seats</button></div>
                    </div>
                </div>
            )}

            {/* Assign modal */}
            {assignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">Assign Seat {assignModal.label}</h2>
                        <p className="text-sm text-surface-500 mb-4">Select a company to assign this seat to:</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {companies.filter(c => c.status === 'active').map(c => (
                                <button key={c.id} onClick={() => handleAssign(assignModal.id, c.id)} className="w-full text-left p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-surface-200 dark:border-surface-700 transition-all">
                                    <p className="font-medium text-sm">{c.name}</p>
                                    <p className="text-xs text-surface-400">{c.contactPerson}</p>
                                </button>
                            ))}
                            {companies.filter(c => c.status === 'active').length === 0 && <p className="text-sm text-surface-400 text-center py-4">No active companies</p>}
                        </div>
                        <button onClick={() => setAssignModal(null)} className="btn-secondary w-full mt-4">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
