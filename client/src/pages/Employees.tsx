import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus, deleteEmployee } from '../lib/api';
import { Plus, Edit2, Trash2, UserCheck, UserX, Key } from 'lucide-react';
import EmployeeModal from '../components/EmployeeModal';
import PasswordModal from '../components/PasswordModal';

export default function Employees() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [passwordEmployee, setPasswordEmployee] = useState<any>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const employees = data?.data || [];

  const createMutation = useMutation({ mutationFn: createEmployee, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setShowCreate(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }: any) => updateEmployee(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setEditingEmployee(null); } });
  const toggleMutation = useMutation({ mutationFn: toggleEmployeeStatus, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); } });
  const deleteMutation = useMutation({ mutationFn: deleteEmployee, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); } });

  if (isLoading) return <div className="p-8">Loading employees...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Create Employee</button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Role</th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp: any) => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{emp.name}</td>
                <td className="p-4 text-gray-600">{emp.email}</td>
                <td className="p-4"><span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">{emp.role}</span></td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.status}</span></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => setEditingEmployee(emp)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setPasswordEmployee(emp)} className="text-orange-600 hover:text-orange-800"><Key className="w-4 h-4" /></button>
                    <button onClick={() => toggleMutation.mutate(emp.id)} className={emp.status === 'ACTIVE' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}>{emp.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</button>
                    <button onClick={() => { if (confirm('Delete this employee?')) deleteMutation.mutate(emp.id); }} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && <div className="p-8 text-center text-gray-500">No employees found.</div>}
      </div>
      {showCreate && <EmployeeModal onClose={() => setShowCreate(false)} onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} title="Create Employee" />}
      {editingEmployee && <EmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} onSubmit={(d) => updateMutation.mutate({ id: editingEmployee.id, data: d })} loading={updateMutation.isPending} title="Edit Employee" />}
      {passwordEmployee && <PasswordModal employee={passwordEmployee} onClose={() => setPasswordEmployee(null)} />}
    </div>
  );
}
