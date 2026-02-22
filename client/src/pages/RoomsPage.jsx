import { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const AMENITIES_OPTIONS = ['Projector', 'TV', 'Whiteboard', 'Video Conference', 'AC', 'WiFi', 'Phone', 'Coffee'];
const initForm = { name: '', code: '', capacity: 10, floor: '1', amenities: [], hourlyCost: 500, gstApplicable: true, gstPercent: 18, bufferTime: 15, status: 'active' };

export default function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initForm);
    const toast = useToast();

    const load = () => { setLoading(true); roomsAPI.list().then(setRooms).catch(() => setRooms([])).finally(() => setLoading(false)); };
    useEffect(load, []);

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const toggleAmenity = (a) => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));

    const openAdd = () => { setEditing(null); setForm(initForm); setShowModal(true); };
    const openEdit = (r) => { setEditing(r.id); setForm({ name: r.name, code: r.code || '', capacity: r.capacity, floor: r.floor || '', amenities: r.amenities || [], hourlyCost: r.hourlyCost, gstApplicable: r.gstApplicable, gstPercent: r.gstPercent, bufferTime: r.bufferTime, status: r.status }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await roomsAPI.update(editing, form); toast.success('Room updated'); }
            else { await roomsAPI.create(form); toast.success('Room added'); }
            setShowModal(false); load();
        } catch (err) { toast.error(err.message); }
    };

    const handleDelete = async (id) => {
        try { await roomsAPI.delete(id); toast.success('Room deactivated'); load(); } catch (err) { toast.error(err.message); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Meeting Rooms</h1><p className="text-sm text-surface-500">{rooms.length} rooms configured</p></div>
                <button onClick={openAdd} className="btn-primary">+ Add Room</button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
            ) : rooms.length === 0 ? (
                <div className="glass-card p-12 text-center"><span className="text-4xl block mb-3">🚪</span><p className="text-lg font-medium text-surface-600 dark:text-surface-400">No meeting rooms</p><button onClick={openAdd} className="btn-primary mt-4">Add First Room</button></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map(room => (
                        <div key={room.id} className="glass-card overflow-hidden group hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-0.5">
                            <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center relative">
                                <span className="text-5xl opacity-80">🏢</span>
                                <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${room.status === 'active' ? 'bg-green-500/90 text-white' : room.status === 'maintenance' ? 'bg-amber-500/90 text-white' : 'bg-surface-500/90 text-white'}`}>{room.status}</span>
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <div><h3 className="font-semibold text-surface-900 dark:text-surface-100">{room.name}</h3><p className="text-xs text-surface-400">{room.code || 'No code'} · Floor {room.floor}</p></div>
                                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">₹{room.hourlyCost}/hr</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-surface-500 mb-3">
                                    <span>👥 {room.capacity}</span>
                                    <span>⏱ {room.bufferTime}min buffer</span>
                                    {room.gstApplicable && <span>GST {room.gstPercent}%</span>}
                                </div>
                                {room.amenities?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">{room.amenities.slice(0, 4).map(a => <span key={a} className="badge-info text-[10px]">{a}</span>)}{room.amenities.length > 4 && <span className="badge-neutral text-[10px]">+{room.amenities.length - 4}</span>}</div>
                                )}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                                    <button onClick={() => openEdit(room)} className="btn-ghost text-xs flex-1">Edit</button>
                                    <button onClick={() => handleDelete(room.id)} className="btn-ghost text-xs text-red-500 flex-1">Deactivate</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Room' : 'Add Meeting Room'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Room Name *</label><input value={form.name} onChange={e => update('name', e.target.value)} className="input-field" required /></div>
                                <div><label className="block text-sm font-medium mb-1">Room Code</label><input value={form.code} onChange={e => update('code', e.target.value)} className="input-field" placeholder="MR-01" /></div>
                                <div><label className="block text-sm font-medium mb-1">Capacity</label><input type="number" value={form.capacity} onChange={e => update('capacity', parseInt(e.target.value))} className="input-field" min="1" /></div>
                                <div><label className="block text-sm font-medium mb-1">Floor</label><input value={form.floor} onChange={e => update('floor', e.target.value)} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Hourly Cost (₹)</label><input type="number" value={form.hourlyCost} onChange={e => update('hourlyCost', parseFloat(e.target.value))} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Buffer Time (min)</label><input type="number" value={form.bufferTime} onChange={e => update('bufferTime', parseInt(e.target.value))} className="input-field" /></div>
                                <div><label className="block text-sm font-medium mb-1">Status</label><select value={form.status} onChange={e => update('status', e.target.value)} className="select-field"><option value="active">Active</option><option value="inactive">Inactive</option><option value="maintenance">Maintenance</option></select></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Amenities</label>
                                <div className="flex flex-wrap gap-2">{AMENITIES_OPTIONS.map(a => (
                                    <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.amenities.includes(a) ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300' : 'border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>{a}</button>
                                ))}</div>
                            </div>
                            <div className="flex items-center gap-3"><input type="checkbox" checked={form.gstApplicable} onChange={e => update('gstApplicable', e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-primary-500" /><label className="text-sm font-medium">GST Applicable</label>{form.gstApplicable && <input type="number" value={form.gstPercent} onChange={e => update('gstPercent', parseFloat(e.target.value))} className="input-field w-20 ml-2" />}</div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Save' : 'Add Room'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
