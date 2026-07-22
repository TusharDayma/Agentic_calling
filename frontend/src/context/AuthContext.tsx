import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getMeApi, loginApi } from '../api/client';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ role: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('talent_token');
        if (storedToken) {
            setToken(storedToken);
            getMeApi()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('talent_token');
                    setToken(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await loginApi(email, password);
        const { access_token, role } = res.data;
        localStorage.setItem('talent_token', access_token);
        setToken(access_token);
        const me = await getMeApi();
        setUser(me.data);
        return { role };
    };

    const logout = () => {
        localStorage.removeItem('talent_token');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
