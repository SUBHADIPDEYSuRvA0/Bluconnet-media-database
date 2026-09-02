import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { changeEmployeePassword } from '../lib/api';

export default function PasswordModal({ employee, onClose }: any) {
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => changeEmployeePassword(employee.id, password),
    onSuccess: () => { alert('Password changed successfully!'); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Change Password</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">For: <strong>{employee.email}</strong></p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 6 chars)" className="w-full px-3 py-2 border rounded-md" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || password.length < 6} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">Change</button>
        </div>
      </div>
    </div>
  );
}
