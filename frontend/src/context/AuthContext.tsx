import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getMeApi, loginApi } from '../api/client';

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ role: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('talent_token');
        const storedRole = localStorage.getItem('talent_role');
        if (storedToken) {
            setToken(storedToken);
            setRole(storedRole);
            getMeApi()
                .then((res) => {
                    setUser(res.data);
                    setRole(res.data.role);
                })
                .catch(() => {
                    localStorage.removeItem('talent_token');
                    localStorage.removeItem('talent_role');
                    setToken(null);
                    setRole(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        const res = await loginApi(username, password);
        const { access_token, role } = res.data;
        localStorage.setItem('talent_token', access_token);
        localStorage.setItem('talent_role', role);
        setToken(access_token);
        setRole(role);
        const me = await getMeApi();
        setUser(me.data);
        return { role };
    };

    const logout = () => {
        localStorage.removeItem('talent_token');
        localStorage.removeItem('talent_role');
        setToken(null);
        setRole(null);
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, role, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
