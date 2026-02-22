import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import SeatsPage from './pages/SeatsPage';
import InvoicesPage from './pages/InvoicesPage';
import RoomsPage from './pages/RoomsPage';
import BookingsPage from './pages/BookingsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!user) return <Navigate to="/login" />;
    if (!user.setupCompleted && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" />;
    return children;
}

function AppRoutes() {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/login" />} />
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="seats" element={<SeatsPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <ToastProvider>
                        <AppRoutes />
                    </ToastProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
