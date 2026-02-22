const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth
export const authAPI = {
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    googleAuth: (data) => request('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
    forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
};

// Profile
export const profileAPI = {
    get: () => request('/profile'),
    update: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
    uploadLogo: (formData) => request('/profile/logo', { method: 'POST', body: formData }),
};

// Companies
export const companiesAPI = {
    list: (params = '') => request(`/companies?${params}`),
    get: (id) => request(`/companies/${id}`),
    create: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/companies/${id}`, { method: 'DELETE' }),
    uploadDoc: (id, formData) => request(`/companies/${id}/documents`, { method: 'POST', body: formData }),
    deleteDoc: (compId, docId) => request(`/companies/${compId}/documents/${docId}`, { method: 'DELETE' }),
};

// Seats
export const seatsAPI = {
    list: () => request('/seats'),
    stats: () => request('/seats/stats'),
    create: (data) => request('/seats', { method: 'POST', body: JSON.stringify(data) }),
    assign: (id, data) => request(`/seats/${id}/assign`, { method: 'PUT', body: JSON.stringify(data) }),
    unassign: (id) => request(`/seats/${id}/unassign`, { method: 'PUT' }),
    update: (id, data) => request(`/seats/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/seats/${id}`, { method: 'DELETE' }),
};

// Invoices
export const invoicesAPI = {
    list: (params = '') => request(`/invoices?${params}`),
    get: (id) => request(`/invoices/${id}`),
    generate: (data) => request('/invoices/generate', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    recordPayment: (id, data) => request(`/invoices/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
};

// Meeting Rooms
export const roomsAPI = {
    list: () => request('/rooms'),
    create: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
    bookings: (params = '') => request(`/rooms/bookings?${params}`),
    createBooking: (data) => request('/rooms/bookings', { method: 'POST', body: JSON.stringify(data) }),
    updateBookingStatus: (id, data) => request(`/rooms/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    availability: (roomId, date) => request(`/rooms/rooms/${roomId}/availability?date=${date}`),
    allowances: () => request('/rooms/allowances'),
    createAllowance: (data) => request('/rooms/allowances', { method: 'POST', body: JSON.stringify(data) }),
};

// Reports
export const reportsAPI = {
    dashboard: () => request('/reports/dashboard'),
    revenue: (params = '') => request(`/reports/revenue?${params}`),
    overdue: () => request('/reports/overdue'),
    gst: (params = '') => request(`/reports/gst?${params}`),
    roomUtilization: (params = '') => request(`/reports/room-utilization?${params}`),
};

// Settings
export const settingsAPI = {
    getReminders: () => request('/settings/reminders'),
    updateReminders: (data) => request('/settings/reminders', { method: 'PUT', body: JSON.stringify(data) }),
    getEmailTemplates: () => request('/settings/email-templates'),
    updateEmailTemplate: (id, data) => request(`/settings/email-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getAuditLogs: (params = '') => request(`/settings/audit-logs?${params}`),
};
