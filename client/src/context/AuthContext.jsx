import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            authAPI.me().then(u => { setUser(u); setLoading(false); }).catch(() => { localStorage.removeItem('token'); setLoading(false); });
        } else setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await authAPI.login({ email, password });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    }, []);

    const register = useCallback(async (email, password, name) => {
        const data = await authAPI.register({ email, password, name });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    }, []);

    const googleLogin = useCallback(async (googleData) => {
        const data = await authAPI.googleAuth(googleData);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try { const u = await authAPI.me(); setUser(u); } catch (e) { /* ignore */ }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
