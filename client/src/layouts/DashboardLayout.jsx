import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/companies', label: 'Companies', icon: '🏢' },
    { path: '/seats', label: 'Seats', icon: '💺' },
    { path: '/invoices', label: 'Invoices', icon: '🧾' },
    { path: '/rooms', label: 'Meeting Rooms', icon: '🚪' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const { dark, toggle } = useTheme();
    const location = useLocation();

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile overlay */}
            {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-100 dark:border-surface-800">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">C</div>
                    {sidebarOpen && <span className="font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent truncate">CoWorkSpace</span>}
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path} end={item.path === '/'}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-3' : ''}`}
                            onClick={() => setMobileOpen(false)}>
                            <span className="text-lg">{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse toggle */}
                <div className="p-3 border-t border-surface-100 dark:border-surface-800 hidden lg:block">
                    <button onClick={() => setSidebarOpen(o => !o)} className="btn-ghost w-full justify-center text-xs">
                        {sidebarOpen ? '◀ Collapse' : '▶'}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top navbar */}
                <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden btn-ghost p-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h1 className="text-lg font-semibold text-surface-800 dark:text-surface-100 capitalize">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggle} className="btn-ghost p-2.5 rounded-xl" title="Toggle theme">
                            {dark ? '☀️' : '🌙'}
                        </button>
                        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-surface-200 dark:border-surface-700">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {(user?.name || user?.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate max-w-[120px]">{user?.name || 'Owner'}</p>
                                <p className="text-xs text-surface-500 truncate max-w-[120px]">{user?.email}</p>
                            </div>
                        </div>
                        <button onClick={logout} className="btn-ghost text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1">Logout</button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-50 dark:bg-surface-950">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
