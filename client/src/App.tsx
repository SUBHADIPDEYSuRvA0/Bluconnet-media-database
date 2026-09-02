import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Employees from './pages/Employees';
import SuperAdmin from './pages/Dashboard';
import Login from './pages/Login';
import { getMe } from './lib/api';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute><Layout><Companies /></Layout></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Layout><Employees /></Layout></ProtectedRoute>} />
          <Route path="/super-admin" element={<ProtectedRoute><Layout><SuperAdmin /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    getMe().then((res) => { setRole(res.data?.role || ''); setName(res.data?.name || 'User'); }).catch(() => {});
  }, []);

  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <img src="/logo192.png" alt="Logo" className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-8">B2B Lead Platform</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 rounded hover:bg-slate-800">Dashboard</a>
          <a href="/companies" className="block py-2 px-4 rounded hover:bg-slate-800">Companies</a>
          {isSuperAdmin && <a href="/super-admin" className="block py-2 px-4 rounded hover:bg-slate-800 bg-slate-800 text-yellow-400 font-semibold">Super Admin</a>}
          {isAdmin && <a href="/employees" className="block py-2 px-4 rounded hover:bg-slate-800">Employees</a>}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="font-semibold text-gray-700">Welcome, {name}</h1>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }} className="text-sm text-red-600">Logout</button>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}