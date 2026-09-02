   import React, { useState } from 'react';
   import { login } from '../lib/api';

   export default function Login() {
     const [email, setEmail] = useState('admin@bluconnetmedia.com');
     const [password, setPassword] = useState('Admin@1234');
     const [error, setError] = useState('');

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setError('');
       try {
         await login(email.trim(), password);
         window.location.href = '/'; // Refresh to load dashboard
       } catch (err: any) {
         const msg = err?.response?.data?.message;
         setError(msg ? `Login failed: ${msg}` : 'Invalid credentials. Please try again.');
       }
     };

     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-100">
         <div className="bg-white p-8 rounded-lg shadow-md w-96">
           <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">B2B Platform Login</h2>
           {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
           <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">Email</label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 required
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Password</label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 required
               />
             </div>
             <button
               type="submit"
               className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
             >
               Sign In
             </button>
           </form>
         </div>
       </div>
     );
   }